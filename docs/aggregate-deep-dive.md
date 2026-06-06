# Les Agrégats DDD en Profondeur

## Le Problème que Résolvent les Agrégats

Considérons un système de réservation de rendez-vous médicaux sans frontières claires. Un patient réserve un créneau de 30 minutes à 10h00. Simultanément, un autre patient réserve le même créneau. Les deux requêtes passent la validation indépendamment. Les deux réussissent. Deux patients arrivent à 10h00 chez le même médecin. L'invariant "un seul patient par créneau" a été violé car aucune frontière n'existait pour l'appliquer de manière atomique.

C'est le premier problème que résolvent les agrégats : **les violations d'invariants sans frontières**. Les règles métier qui couvrent plusieurs objets ne peuvent pas être appliquées si ces objets peuvent être modifiés indépendamment. Quand la validation se produit en dehors d'une frontière transactionnelle, les conditions de concurrence deviennent inévitables.

Le deuxième problème concerne les **problèmes de concurrence**. Sans agrégats, les développeurs recourent souvent au verrouillage au niveau base de données sur des lignes individuelles. Cela crée un comportement imprévisible, une dégradation des performances et, pire encore, une fuite de la logique métier dans l'infrastructure. La règle métier "les créneaux adjacents doivent être disponibles pour les visites doubles" se retrouve cachée dans une transaction SQL au lieu d'être explicite dans le modèle du domaine.

Le troisième problème est celui des **règles métier dispersées**. Sans agrégats, les invariants se répandent à travers les services, les contrôleurs et les contraintes de base de données. Quand une règle métier change, les développeurs fouillent dans plusieurs couches pour trouver tous les points d'application. Certains sont mis à jour, d'autres non. Le système devient incohérent au fil du temps.

Les agrégats résolvent ces problèmes en créant des frontières explicites autour des règles métier. Ils définissent ce qui doit changer ensemble, ce qui doit être validé ensemble et ce qui doit être persisté ensemble.

---

## Anatomie d'un Agrégat

Un agrégat se compose de trois blocs de construction arrangés dans une hiérarchie stricte.

**La Racine d'Agrégat (Aggregate Root)** est le point d'entrée unique vers l'agrégat. Elle possède une identité globalement unique, ce qui signifie que d'autres parties du système peuvent la référencer par son ID. La racine agit comme un gardien : toutes les modifications des objets internes doivent passer par elle. Le code externe n'atteint jamais au-delà de la racine pour manipuler directement les éléments internes.

```typescript
// ✅ CORRECT: DailySchedule is the aggregate root
class DailySchedule {
  constructor(
    private readonly id: DailyScheduleId, // Global identity
    private readonly doctorId: DoctorId,
    private readonly date: ScheduleDate,
    private slots: Slot[], // Internal entities
  ) {}

  bookSlot(slotId: SlotId, patientId: PatientId): void {
    const slot = this.findSlotOrFail(slotId);
    slot.book(patientId); // Root controls access
  }
}
```

**Les Entités Internes** ont une identité, mais uniquement au sein de l'agrégat. Un `Slot` possède un `SlotId`, mais cet ID n'a aucun sens en dehors de son `DailySchedule`. Vous ne pouvez pas charger un `Slot` directement depuis la base de données. Vous ne pouvez pas référencer un `Slot` depuis un autre agrégat. Son identité existe uniquement pour permettre à la racine de gérer ses enfants.

```typescript
// Slot is an internal entity - local identity only
class Slot {
  constructor(
    private readonly id: SlotId, // Local identity
    private readonly startTime: Time,
    private readonly duration: Duration,
    private status: SlotStatus,
    private patientId: PatientId | null,
  ) {}

  book(patientId: PatientId): void {
    if (this.status !== SlotStatus.Available) {
      throw new SlotNotAvailableError(this.id);
    }
    this.status = SlotStatus.Booked;
    this.patientId = patientId;
  }
}
```

**Les Value Objects** n'ont pas d'identité. Ils sont entièrement définis par leurs attributs. Un `Time` de 10h00 est égal à n'importe quel autre `Time` de 10h00. Les value objects sont immuables et librement partageables.

```typescript
// Time is a value object - no identity, defined by value
class Time {
  private constructor(
    private readonly hours: number,
    private readonly minutes: number,
  ) {}

  static of(hours: number, minutes: number): Time {
    if (hours < 0 || hours > 23) throw new InvalidTimeError();
    if (minutes < 0 || minutes > 59) throw new InvalidTimeError();
    return new Time(hours, minutes);
  }

  equals(other: Time): boolean {
    return this.hours === other.hours && this.minutes === other.minutes;
  }

  addMinutes(minutes: number): Time {
    const totalMinutes = this.hours * 60 + this.minutes + minutes;
    return Time.of(Math.floor(totalMinutes / 60) % 24, totalMinutes % 60);
  }
}
```

---

## Le Principe de l'Invariant

Un invariant est une règle métier qui doit **toujours** être vraie. Pas éventuellement. Pas après une action compensatoire. Toujours. À chaque instant, après chaque opération, l'invariant tient.

Dans le domaine de la réservation médicale, considérons ces invariants :

**Invariant 1** : Un créneau ne peut être réservé que par un seul patient à la fois. Si ceci est violé, deux patients se présentent simultanément. Il n'existe aucune action corrective qui règle cela élégamment.

**Invariant 2** : Une visite double nécessite deux créneaux adjacents disponibles. Si un patient réserve une procédure de 60 minutes mais qu'un seul créneau est réellement libre, l'agenda du médecin est cassé. Le deuxième patient du créneau suivant arrive pour découvrir que son rendez-vous est inutilisable.

**Invariant 3** : Un créneau ne peut pas être réservé avant que l'agenda soit publié. Réserver sur un agenda non publié signifie que les patients confirment des rendez-vous qui pourraient encore changer. Cela crée des engagements non tenus.

Toutes les règles métier ne sont pas des invariants. "Un patient ne devrait pas réserver plus de 10 rendez-vous par mois" est une règle souple. Si elle est violée, l'entreprise peut corriger : appeler le patient, reprogrammer certains rendez-vous, signaler le compte. Le système reste cohérent. Cette distinction est extrêmement importante pour la conception des agrégats.

---

## La Frontière Transactionnelle

Une transaction égale un agrégat. C'est non négociable.

Quand vous sauvegardez un agrégat, vous le sauvegardez entièrement, atomiquement, dans une seule transaction. Vous ne sauvegardez jamais la moitié d'un agrégat. Vous ne sauvegardez jamais deux agrégats dans une seule transaction. Cette règle semble restrictive mais existe pour des raisons critiques.

Les transactions inter-agrégats créent un couplage implicite. Si `ServiceA` sauvegarde `AggregateX` et `AggregateY` ensemble, et que `ServiceB` modifie également `AggregateY`, vous avez créé une dépendance cachée. Maintenant `ServiceA` doit se coordonner avec `ServiceB` pour éviter les deadlocks et les conditions de concurrence. Cette exigence de coordination se propage dans le codebase comme un virus.

```typescript
// ❌ WRONG: Cross-aggregate transaction
async transferPatientRecords(fromDoctorId: DoctorId, toDoctorId: DoctorId) {
  await this.db.transaction(async (tx) => {
    const fromSchedule = await this.scheduleRepo.findById(fromDoctorId, tx)
    const toSchedule = await this.scheduleRepo.findById(toDoctorId, tx)

    // Two aggregates in one transaction
    // Creates locking issues, hidden coupling
    fromSchedule.releaseAllSlots()
    toSchedule.acceptTransferredPatients(fromSchedule.patients)

    await this.scheduleRepo.save(fromSchedule, tx)
    await this.scheduleRepo.save(toSchedule, tx)
  })
}
```

Quand vous ressentez le besoin de transactions inter-agrégats, la conception vous dit quelque chose. Soit ces deux agrégats devraient n'en faire qu'un, soit la cohérence peut être éventuelle.

Pour la cohérence éventuelle, utilisez les événements de domaine. Quand `ScheduleA` termine une opération, il émet un événement. Un handler traite cet événement et modifie `ScheduleB` dans une transaction séparée. Si quelque chose échoue, des actions compensatoires ou des retry gèrent la situation.

```typescript
// ✅ CORRECT: Domain events for eventual consistency
class DailySchedule {
  private domainEvents: DomainEvent[] = [];

  cancelAllSlots(reason: CancellationReason): void {
    for (const slot of this.slots) {
      if (slot.isBooked()) {
        slot.cancel();
        this.domainEvents.push(new SlotCancelledEvent(this.id, slot.id, slot.patientId, reason));
      }
    }
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}

// Event handler runs in separate transaction
class NotifyPatientOnCancellation {
  async handle(event: SlotCancelledEvent): Promise<void> {
    await this.notificationService.sendCancellationNotice(
      event.patientId,
      event.scheduleId,
      event.slotId,
    );
  }
}
```

---

## Dimensionnement des Agrégats : Le Compromis Central

Deux forces tirent la conception des agrégats dans des directions opposées.

**Force 1 : Les agrégats plus grands protègent plus d'invariants**. Si `DoctorProfile`, `WeeklySchedule` et `Credentials` forment un seul agrégat, vous pouvez appliquer des règles comme "un médecin ne peut pas accepter de rendez-vous tant que ses accréditations ne sont pas vérifiées." Tout est cohérent, toujours.

**Force 2 : Les agrégats plus petits réduisent la contention**. Quand deux utilisateurs modifient le même agrégat simultanément, l'un gagne et l'autre réessaie. Si `WeeklySchedule` fait partie d'un agrégat géant `Doctor`, la mise à jour des accréditations bloque la réservation de rendez-vous. Des opérations sans rapport entrent en compétition pour le même verrou.

La résolution réside dans la distinction entre les vrais invariants et les préférences.

Posez cette question : "Si ces deux données changent à une milliseconde d'intervalle, est-ce que le métier casse ?"

Si un patient réserve un créneau à 10:00:00.000 et qu'un autre patient réserve un créneau adjacent à 10:00:00.001, et qu'une visite double nécessite les deux, le métier casse. Ceux-ci doivent être dans le même agrégat.

Si la photo de profil d'un médecin se met à jour à 10:00:00.000 et que son agenda change à 10:00:00.001, rien ne casse. Ceux-ci peuvent être des agrégats séparés.

---

## Étude de Cas : Slot vs DailySchedule

### Design A : Slot comme Agrégat

```typescript
// Slot as its own aggregate root
class Slot {
  constructor(
    private readonly id: SlotId,
    private readonly doctorId: DoctorId,
    private readonly date: ScheduleDate,
    private readonly startTime: Time,
    private readonly duration: Duration,
    private status: SlotStatus,
    private patientId: PatientId | null,
  ) {}

  book(patientId: PatientId): void {
    if (this.status !== SlotStatus.Available) {
      throw new SlotNotAvailableError(this.id);
    }
    this.status = SlotStatus.Booked;
    this.patientId = patientId;
  }

  isAvailable(): boolean {
    return this.status === SlotStatus.Available;
  }
}

class SlotRepository {
  async findById(id: SlotId): Promise<Slot>;
  async save(slot: Slot): Promise<void>;
}
```

Ce design protège un seul invariant : un créneau unique ne peut être réservé qu'une seule fois. La méthode `book()` assure cela.

Mais il ne peut pas protéger l'invariant de la visite double. Observez ce qui se passe dans le service applicatif :

```typescript
// ❌ WRONG: Invariant invisible in domain, untestable without database
class BookingService {
  async bookDoubleVisit(slot1Id: SlotId, slot2Id: SlotId, patientId: PatientId): Promise<void> {
    await this.db.transaction(async (tx) => {
      const slot1 = await this.slotRepo.findById(slot1Id, tx);
      const slot2 = await this.slotRepo.findById(slot2Id, tx);

      // Validation in service layer, not domain
      if (!this.areAdjacent(slot1, slot2)) {
        throw new SlotsNotAdjacentError();
      }

      slot1.book(patientId);
      slot2.book(patientId);

      await this.slotRepo.save(slot1, tx);
      await this.slotRepo.save(slot2, tx);
    });
  }
}
```

L'invariant "les créneaux adjacents doivent tous deux être disponibles pour une visite double" vit maintenant dans la couche service, pas dans le domaine. Vous ne pouvez pas tester unitairement ceci sans une transaction de base de données. La règle métier est dispersée à travers l'infrastructure.

Pire encore, considérez cette condition de concurrence :

1. Le Patient A demande une visite double pour les créneaux 10:00 et 10:30
2. Le Patient B demande une visite simple pour le créneau 10:30
3. Les deux services vérifient la disponibilité simultanément
4. Les deux voient 10:30 comme disponible
5. Le Patient A réserve 10:00 et 10:30
6. Le Patient B réserve 10:30

Avec des agrégats de créneaux individuels, cette condition de concurrence est possible même avec le verrouillage optimiste, car les services verrouillent des agrégats différents.

### Design B : DailySchedule comme Agrégat

```typescript
// ✅ CORRECT: DailySchedule contains slots, protects cross-slot invariants
class DailySchedule {
  constructor(
    private readonly id: DailyScheduleId,
    private readonly doctorId: DoctorId,
    private readonly date: ScheduleDate,
    private slots: Slot[],
  ) {}

  bookSlot(startTime: Time, patientId: PatientId): void {
    const slot = this.findAvailableSlotAt(startTime);
    slot.book(patientId);
  }

  bookDoubleVisit(startTime: Time, patientId: PatientId): void {
    const firstSlot = this.findAvailableSlotAt(startTime);
    const secondSlot = this.findAdjacentAvailableSlot(firstSlot);

    // Invariant protected INSIDE the aggregate
    // Both slots checked atomically, no race condition
    firstSlot.book(patientId);
    secondSlot.book(patientId);
  }

  private findAvailableSlotAt(time: Time): Slot {
    const slot = this.slots.find((s) => s.startsAt(time));
    if (!slot) throw new SlotNotFoundError(time);
    if (!slot.isAvailable()) throw new SlotNotAvailableError(slot.id);
    return slot;
  }

  private findAdjacentAvailableSlot(slot: Slot): Slot {
    const nextTime = slot.endTime();
    const adjacent = this.slots.find((s) => s.startsAt(nextTime));
    if (!adjacent) throw new NoAdjacentSlotError(slot.id);
    if (!adjacent.isAvailable()) throw new AdjacentSlotNotAvailableError(adjacent.id);
    return adjacent;
  }
}

// Slot becomes internal entity
class Slot {
  constructor(
    readonly id: SlotId,
    private readonly startTime: Time,
    private readonly duration: Duration,
    private status: SlotStatus,
    private patientId: PatientId | null,
  ) {}

  book(patientId: PatientId): void {
    this.status = SlotStatus.Booked;
    this.patientId = patientId;
  }

  startsAt(time: Time): boolean {
    return this.startTime.equals(time);
  }

  endTime(): Time {
    return this.startTime.addMinutes(this.duration.inMinutes());
  }

  isAvailable(): boolean {
    return this.status === SlotStatus.Available;
  }
}
```

Maintenant le modèle de domaine protège explicitement l'invariant de la visite double. Les tests ne nécessitent aucune base de données :

```typescript
describe('DailySchedule', () => {
  it('books double visit when both slots available', () => {
    const schedule = DailyScheduleBuilder.forDoctor('doc-1')
      .onDate('2024-03-15')
      .withSlotAt(Time.of(10, 0), Duration.minutes(30))
      .withSlotAt(Time.of(10, 30), Duration.minutes(30))
      .build();

    schedule.bookDoubleVisit(Time.of(10, 0), PatientId.of('patient-1'));

    expect(schedule.slotAt(Time.of(10, 0)).isBooked()).toBe(true);
    expect(schedule.slotAt(Time.of(10, 30)).isBooked()).toBe(true);
  });

  it('rejects double visit when second slot unavailable', () => {
    const schedule = DailyScheduleBuilder.forDoctor('doc-1')
      .onDate('2024-03-15')
      .withSlotAt(Time.of(10, 0), Duration.minutes(30))
      .withBookedSlotAt(Time.of(10, 30), Duration.minutes(30), 'other-patient')
      .build();

    expect(() => {
      schedule.bookDoubleVisit(Time.of(10, 0), PatientId.of('patient-1'));
    }).toThrow(AdjacentSlotNotAvailableError);
  });
});
```

Le compromis est la contention. Toutes les réservations pour une seule journée passent par un seul agrégat. Si Dr. Dupont a 20 créneaux par jour et que 5 patients réservent simultanément, 4 devront réessayer. Pour la plupart des cabinets médicaux, c'est acceptable. Les agendas journaliers ne voient pas des centaines de réservations concurrentes par seconde.

---

## Quand Utiliser des Politiques Correctives à la Place

Toutes les règles métier n'appartiennent pas à un agrégat. Considérez cette règle : "Un patient ne devrait pas réserver plus de 10 rendez-vous par mois."

Pour appliquer ceci comme un vrai invariant, vous auriez besoin d'un agrégat contenant tous les rendez-vous d'un patient. Chaque opération de réservation chargerait l'historique complet des rendez-vous. Chaque réservation concurrente pour ce patient entrerait en contention pour le même agrégat. Le coût en performance et en complexité est énorme.

Mais posez la question : si un patient réserve le rendez-vous 11 à 10:00:00.000 et le rendez-vous 12 à 10:00:00.001, est-ce que le métier casse ?

Pas vraiment. La secrétaire appelle le patient, explique la politique et reprogramme certains rendez-vous. L'entreprise a un processus correctif.

Implémentez ceci comme une politique corrective :

```typescript
// ✅ CORRECT: Soft rule as corrective policy
class MonthlyBookingLimitPolicy {
  async check(patientId: PatientId, month: YearMonth): Promise<PolicyResult> {
    const count = await this.appointmentQuery.countForPatientInMonth(patientId, month);

    if (count >= 10) {
      return PolicyResult.warn(`Patient has ${count} appointments this month. Limit is 10.`);
    }

    return PolicyResult.ok();
  }
}

class BookingService {
  async bookSlot(request: BookingRequest): Promise<BookingResult> {
    const policyResult = await this.monthlyLimitPolicy.check(
      request.patientId,
      request.date.toYearMonth(),
    );

    if (policyResult.isWarning()) {
      // Log for review, maybe require manager approval
      await this.auditLog.record(policyResult.message);
    }

    // Proceed with booking - the aggregate protects TRUE invariants
    const schedule = await this.scheduleRepo.findByDoctorAndDate(request.doctorId, request.date);
    schedule.bookSlot(request.startTime, request.patientId);
    await this.scheduleRepo.save(schedule);

    return BookingResult.success();
  }
}
```

Ayez cette conversation avec les experts métier : "Si cette règle est violée pendant quelques minutes, que se passe-t-il ? Y a-t-il un processus manuel pour corriger ? Quelle est la gravité de la violation ?" Les réponses révèlent si vous avez besoin d'un invariant ou d'une politique.

---

## Référence par Identité

Les agrégats se référencent mutuellement par ID, jamais par référence directe à l'objet.

```typescript
// ❌ WRONG: Direct object reference creates implicit coupling
class Appointment {
  constructor(
    private readonly id: AppointmentId,
    private readonly patient: Patient, // Direct reference
    private readonly doctor: Doctor, // Direct reference
    private readonly slot: Slot,
  ) {}
}

// Loading an Appointment now loads Patient and Doctor
// Changes to Patient affect Appointment's consistency
// Transaction boundaries become unclear
```

```typescript
// ✅ CORRECT: Reference by identity
class Appointment {
  constructor(
    private readonly id: AppointmentId,
    private readonly patientId: PatientId, // ID reference only
    private readonly doctorId: DoctorId, // ID reference only
    private readonly scheduleId: DailyScheduleId,
    private readonly slotId: SlotId,
  ) {}
}

// Appointment is self-contained
// Load only what you need, when you need it
// Clear aggregate boundaries
```

La référence par identité impose l'isolation des agrégats. Vous ne pouvez pas accidentellement atteindre les éléments internes d'un autre agrégat. Vous ne pouvez pas accidentellement créer des transactions inter-agrégats. La conception rend la bonne chose facile et la mauvaise chose impossible.

Quand vous avez besoin de données d'un autre agrégat, interrogez-le séparément :

```typescript
class AppointmentDetailsQuery {
  async execute(appointmentId: AppointmentId): Promise<AppointmentDetails> {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    const patient = await this.patientRepo.findById(appointment.patientId);
    const doctor = await this.doctorRepo.findById(appointment.doctorId);

    return new AppointmentDetails(appointment, patient.name, doctor.name, doctor.specialty);
  }
}
```

---

## Le Pattern Repository

Un repository par type d'agrégat. C'est la règle.

```typescript
// ✅ CORRECT: One repository per aggregate
interface DailyScheduleRepository {
  findById(id: DailyScheduleId): Promise<DailySchedule | null>;
  findByDoctorAndDate(doctorId: DoctorId, date: ScheduleDate): Promise<DailySchedule | null>;
  save(schedule: DailySchedule): Promise<void>;
}
```

N'exposez jamais de repositories pour les entités internes :

```typescript
// ❌ WRONG: Repository for internal entity
interface SlotRepository {
  findById(id: SlotId): Promise<Slot>;
  save(slot: Slot): Promise<void>;
}

// This breaks encapsulation
// External code can now modify Slot without going through DailySchedule
// Invariants can be bypassed
```

Chargez l'agrégat entier, modifiez-le, sauvegardez l'agrégat entier :

```typescript
class BookingService {
  async bookSlot(
    doctorId: DoctorId,
    date: ScheduleDate,
    startTime: Time,
    patientId: PatientId,
  ): Promise<void> {
    // Load whole aggregate
    const schedule = await this.scheduleRepo.findByDoctorAndDate(doctorId, date);
    if (!schedule) throw new ScheduleNotFoundError(doctorId, date);

    // Modify through aggregate root
    schedule.bookSlot(startTime, patientId);

    // Save whole aggregate
    await this.scheduleRepo.save(schedule);
  }
}
```

L'implémentation du repository gère la complexité de la persistance des entités internes. Du point de vue du domaine, l'agrégat est une seule unité.

---

## Checklist Récapitulative

Utilisez cette checklist lors de la conception des agrégats :

- [ ] Identifié les vrais invariants avec le test "à une milliseconde d'intervalle"
- [ ] La racine d'agrégat a une identité globale et est le seul point d'entrée
- [ ] Les entités internes ont une identité locale uniquement, jamais exposées directement
- [ ] Les value objects sont immuables et comparés par valeur
- [ ] Une transaction sauvegarde exactement un agrégat
- [ ] La cohérence inter-agrégats utilise des événements de domaine, pas des transactions
- [ ] Les agrégats se référencent mutuellement par ID, jamais par objet
- [ ] Un repository par type d'agrégat, jamais pour les entités internes
- [ ] Les règles souples utilisent des politiques correctives, pas l'expansion de l'agrégat
- [ ] Le repository charge et sauvegarde les agrégats entiers atomiquement
