# Kapitel 14: Concurrency & Virtual Threads

## 1. Core Java 21 Prüfungsziele
- Multi-Threading-Konzepte, den `Thread`-Lebenszyklus und die Task-Ausführung mit `Runnable` und `Callable` verstehen.
- Thread-Pools mit `ExecutorService` und Concurrency-Dienstprogrammen verwalten.
- Thread-sicheren Code unter Verwendung des `synchronized`-Schlüsselworts und thread-sicherer Collections schreiben.
- Plattform-Threads mit Java 21 **Virtual Threads** (Project Loom) vergleichen.
- **Thread Pinning** und die Interna des Virtual-Thread-Schedulings in der JVM beherrschen.

---

## 2. Detaillierte Konzepte

### Platform Threads vs. Virtual Threads
Java 21 führt **Virtual Threads** als leichtgewichtige Alternative zu herkömmlichen Threads ein:
- **Platform Threads:** Standard-Java-Threads, die 1:1 auf Betriebssystem-Threads (OS-Threads) abgebildet werden. Sie sind schwerfällig, ressourcenintensiv (benötigen ca. 1 MB Stack-Speicher) und Context Switches erfordern die Beteiligung des Betriebssystem-Kernels.
- **Virtual Threads:** Leichtgewichtige Threads, die von der **JVM Runtime** und nicht vom Betriebssystem verwaltet werden. Sie laufen auf einem Pool von Plattform-Threads (den sogenannten **Carrier Threads**). Sie benötigen lediglich Bytes an Speicher statt Megabytes, was die gleichzeitige Ausführung von Millionen virtueller Threads ermöglicht.

### Thread Pinning
Wenn ein virtueller Thread eine blockierende Operation ausführt (z. B. Warten auf Netzwerk-I/O oder Dateizugriff), entkoppelt der JVM-Scheduler den virtuellen Thread automatisch von seinem Plattform-**Carrier-Thread** (**unmounts**), wodurch der Carrier-Thread frei wird, um andere virtuelle Threads auszuführen.
In bestimmten Szenarien bleibt der virtuelle Thread jedoch an seinen Carrier-Thread **festgepinnt** (**pinned**):
- **Innerhalb von `synchronized`-Blöcken oder -Methoden:** Wenn ein virtueller Thread einen `synchronized`-Block betritt, kann er nicht entkoppelt werden.
- **Innerhalb nativer Aufrufe:** Bei der Ausführung von nativem Code über JNI.
- *Auswirkung:* Während ein Thread gepinnt ist, ist sein Carrier-Thread blockiert. Wenn alle Carrier-Threads gepinnt sind, kann die JVM keine anderen virtuellen Threads mehr ausführen, was die Leistungsvorteile von Project Loom aufhebt.
- *Lösung:* Ersetzen Sie `synchronized`-Blöcke durch **`ReentrantLock`** aus `java.util.concurrent.locks`.

---

## 3. JVM-Interna & Speicherlayout

### Virtual Thread Mounting and Scheduling
Die JVM verwendet einen dedizierten **ForkJoinPool** als Scheduler, um virtuelle Threads auszuführen.
1. **Mounting:** Der JVM-Scheduler weist einem Plattform-**Carrier-Thread** einen virtuellen Thread zu. Die Stack-Frames des virtuellen Threads werden vom Heap in den Ausführungs-Stack des Carrier-Threads kopiert.
2. **Unmounting (Yielding):** Wenn der virtuelle Thread blockiert (z. B. `Thread.sleep` oder Socket-Read), gibt er die Ausführung frei. Die JVM kopiert seine Stack-Frames zurück auf den Heap und gibt den Carrier-Thread frei.

```
+-------------------------------------------------------------+
| JVM VIRTUAL THREAD MOUNTING PROCESS                         |
|                                                             |
|           [ JVM Heap Memory ]                               |
|           +-------------------------------------+           |
|           | Virtual Thread Stack Frames         |           |
|           +------------------+------------------+           |
|                              | (Mount / Unmount)            |
|                              v                              |
|           +-------------------------------------+           |
|           | ForkJoinPool Carrier Thread         |           |
|           +-------------------------------------+           |
+-------------------------------------------------------------+
```

---

## 4. Knifflige OCP-Prüfungsfragen

### Frage 1
Was ist das Ergebnis der Ausführung des folgenden Code-Segments unter Java 21?
```java
public class VirtualThreadDaemon {
    public static void main(String[] args) {
        Thread vThread = Thread.ofVirtual().unstarted(() -> {
            System.out.println("Running");
        });
        
        try {
            vThread.setDaemon(false);
            System.out.println("Daemon set");
        } catch (IllegalArgumentException e) {
            System.out.println("IAE");
        } catch (Exception e) {
            System.out.println("Exception");
        }
    }
}
```
- A. Gibt `Daemon set` aus
- B. Gibt `IAE` aus
- C. Gibt `Exception` aus
- D. Die Kompilierung schlägt fehl, da `setDaemon` für virtuelle Threads nicht verfügbar ist.

**Antwort: B**
**Ausführliche Erklärung:**
- **Daemon-Einschränkungen bei virtuellen Threads:** Konzeptionell sind virtuelle Threads immer **Daemon-Threads** (Hintergrund-Threads), und diese Eigenschaft kann nicht geändert werden.
- Die Methode `setDaemon(boolean)` existiert in der Klasse `Thread` (weshalb der Code kompiliert), aber ihr Aufruf mit `false` bei einem virtuellen Thread löst zur Laufzeit eine `IllegalArgumentException` aus.

---

### Frage 2
Betrachten Sie das folgende Programm, das `ExecutorService` verwendet:
```java
import java.util.*;
import java.util.concurrent.*;

public class ExecutorShutdown {
    public static void main(String[] args) throws Exception {
        ExecutorService service = Executors.newSingleThreadExecutor();
        service.submit(() -> {
            try {
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                System.out.print("Interrupted ");
            }
        });
        
        Thread.sleep(100);
        List<Runnable> unexecuted = service.shutdownNow();
        System.out.print(unexecuted.size());
    }
}
```
- A. Gibt `0` aus
- B. Gibt `1` aus
- C. Gibt `Interrupted 0` aus
- D. Gibt `Interrupted 1` aus

**Antwort: C**
**Ausführliche Erklärung:**
- **Verhalten von shutdownNow:** Die Methode `shutdownNow()` versucht, alle aktiv ausgeführten Tasks zu stoppen, indem sie diese unterbricht, und gibt eine Liste der Tasks zurück, die in der Warteschlange auf die Ausführung **gewartet** haben.
- Da wir einen `SingleThreadExecutor` verwenden und der einzige übergebene Task bereits ausgeführt wird (er schläft für 5 Sekunden), ist die Task-Warteschlange leer.
- Daher gibt `shutdownNow()` eine leere Liste zurück (`unexecuted.size() == 0`).
- Währenddessen unterbricht das Herunterfahren den laufenden Task, was eine `InterruptedException` auslöst, wodurch `"Interrupted "` ausgegeben wird. Die Gesamtausgabe lautet somit `Interrupted 0`.

---

### Frage 3
Was ist die Ausgabe des folgenden Programms?
```java
import java.util.*;
import java.util.concurrent.*;

public class CopyOnWriteTest {
    public static void main(String[] args) {
        List<String> list = new CopyOnWriteArrayList<>(List.of("A", "B"));
        Iterator<String> it = list.iterator();
        list.add("C");
        
        try {
            while (it.hasNext()) {
                System.out.print(it.next() + " ");
                it.remove();
            }
        } catch (UnsupportedOperationException e) {
            System.out.print("UOE");
        }
    }
}
```
- A. `A B UOE`
- B. `A B C UOE`
- C. `A B`
- D. `A B C`

**Antwort: A**
**Ausführliche Erklärung:**
- **Funktionsweise des Iterators von CopyOnWriteArrayList:**
  - Der Iterator einer `CopyOnWriteArrayList` arbeitet auf einer **Snapshot-Kopie** (Momentaufnahme) des zugrunde liegenden Arrays, wie es zum Zeitpunkt der Erstellung des Iterators existierte.
  - Spätere Änderungen an der Liste (`list.add("C")`) spiegeln sich nicht im Iterator wider. Daher durchläuft der Iterator nur `"A"` und `"B"`.
  - Der von `CopyOnWriteArrayList` zurückgegebene Iterator ist strikt schreibgeschützt (read-only). Jeder Versuch, `it.remove()` aufzurufen, wirft eine `UnsupportedOperationException` aus (was `UOE` ausgibt).

---

### Frage 4
Was ist das Ergebnis beim Kompilieren und Ausführen des folgenden Programms?
```java
import java.util.concurrent.*;

public class BarrierTest {
    public static void main(String[] args) {
        CyclicBarrier barrier = new CyclicBarrier(3, () -> System.out.print("Barrier "));
        ExecutorService service = Executors.newFixedThreadPool(2);
        
        for (int i = 0; i < 2; i++) {
            service.submit(() -> {
                try {
                    barrier.await();
                    System.out.print("Passed ");
                } catch (Exception e) {}
            });
        }
        service.shutdown();
    }
}
```
- A. Gibt `Barrier Passed Passed ` aus
- B. Gibt `Passed Passed ` aus
- C. Das Programm kompiliert und hängt unendlich lange, ohne etwas auszugeben.
- D. Wirft zur Laufzeit eine `TimeoutException`.

**Antwort: C**
**Ausführliche Erklärung:**
- **Ausrichtung der Parteien (parties) bei einer CyclicBarrier:** Eine `CyclicBarrier` wird mit einer festen Anzahl von Parteien (hier `3`) initialisiert. Das bedeutet, dass genau `3` Threads `await()` aufrufen müssen, damit die Barriere ausgelöst wird.
- In diesem Code werden nur `2` Tasks übergeben, die `await()` aufrufen. Da die dritte Partei niemals `await()` aufruft, warten beide Threads unbegrenzt.
- Das Programm hängt und gibt nichts aus.

---

### Frage 5
Was ist die Ausgabe bei Ausführung des folgenden Programms?
```java
import java.util.concurrent.atomic.AtomicInteger;

public class AtomicTest {
    public static void main(String[] args) {
        AtomicInteger value = new AtomicInteger(10);
        int val1 = value.getAndIncrement();
        int val2 = value.incrementAndGet();
        boolean success = value.compareAndSet(12, 20);
        System.out.println(val1 + " " + val2 + " " + success + " " + value.get());
    }
}
```
- A. `10 12 true 20`
- B. `11 12 false 12`
- C. `10 11 true 20`
- D. `10 12 false 12`

**Antwort: A**
**Ausführliche Erklärung:**
- **AtomicInteger-Operationen:**
  - `value` startet bei `10`.
  - `getAndIncrement()` gibt den alten Wert (`10`) zurück und erhöht den internen Zustand auf `11` (`val1 = 10`).
  - `incrementAndGet()` erhöht den Wert zuerst auf `12` und gibt diesen neuen Wert dann zurück (`val2 = 12`).
  - `compareAndSet(12, 20)` prüft, ob der aktuelle Wert gleich `12` ist. Da dies der Fall ist, setzt es den Wert auf `20` und gibt `true` zurück.
  - Die Ausgabe lautet `10 12 true 20`.

---

### Frage 6
Welche der folgenden Beschreibungen bezüglich Virtual Thread Pinning sind wahr? (Wählen Sie alle zutreffenden Antworten aus)
- A. Ein virtueller Thread ist gepinnt (festgepinnt), wenn er einen nativen Methodenaufruf betritt.
- B. Ein virtueller Thread ist gepinnt, wenn er innerhalb eines `synchronized`-Blocks oder einer `synchronized`-Methode ausgeführt wird.
- C. Das Pinning führt dazu, dass der Betriebssystem-Thread (OS-Thread) beendet wird.
- D. Das Pinning blockiert den Carrier-Plattform-Thread und verhindert, dass dieser andere virtuelle Threads ausführt.

**Antwort: A, B, D**
**Ausführliche Erklärung:**
- **Interna des Thread-Pinnings:**
  - Wenn ein virtueller Thread blockiert (z. B. bei I/O), entkoppelt der JVM-Scheduler ihn vom Carrier-Plattform-Thread (**unmount**), damit dieser andere Aufgaben ausführen kann.
  - Wenn der virtuelle Thread jedoch innerhalb eines `synchronized`-Blocks oder einer Methode ausgeführt wird (B) oder nativen Code über JNI aufruft (A), kann er nicht entkoppelt werden. Er wird als **gepinnt** (pinned) betrachtet.
  - Während er gepinnt ist, ist der Carrier-Plattform-Thread physisch blockiert (D), was die Skalierungsvorteile von Project Loom aufhebt.
  - Der Betriebssystem-Thread wird nicht beendet (C).

---

### Frage 7
Was ist das Ergebnis beim Versuch, den folgenden Code zu kompilieren und auszuführen?
```java
import java.util.concurrent.locks.ReentrantLock;

public class LockFinally {
    private static final ReentrantLock lock = new ReentrantLock();
    
    public static void main(String[] args) {
        lock.lock();
        try {
            System.out.print("Locked ");
            throw new RuntimeException();
        } finally {
            lock.unlock();
            System.out.print("Unlocked");
        }
    }
}
```
- A. Gibt `Locked` aus, gefolgt von einem Kompilierungsfehler.
- B. Gibt `Locked Unlocked` aus und bricht mit einer `RuntimeException` ab.
- C. Gibt `Locked` aus und hängt unbegrenzt.
- D. Gibt `Locked Unlocked` aus und endet normal.

**Antwort: B**
**Ausführliche Erklärung:**
- **Ausführung des finally-Blocks:** Der `finally`-Block wird garantiert ausgeführt, unabhängig davon, ob im `try`-Block eine Exception geworfen wird oder nicht.
- Der Lock (die Sperre) wird im `finally`-Block erfolgreich freigegeben und `"Unlocked"` wird ausgegeben, bevor die nicht abgefangene `RuntimeException` das Programm beendet.

---

### Frage 8
Was ist die Ausgabe beim Kompilieren und Ausführen des folgenden Programms?
```java
import java.util.concurrent.*;

public class CallableRunnable {
    public static void main(String[] args) throws Exception {
        ExecutorService service = Executors.newSingleThreadExecutor();
        
        Future<Integer> f1 = service.submit(() -> { return 5; });
        Future<?> f2 = service.submit(() -> { System.out.print("Run "); });
        
        System.out.print(f1.get() + " " + f2.get());
        service.shutdown();
    }
}
```
- A. Gibt `Run 5 null` aus
- B. Gibt `5 Run null` aus
- C. Die Kompilierung schlägt fehl, da `submit` mit einem Lambda-Ausdruck mehrdeutig ist.
- D. Wirft zur Laufzeit eine `ExecutionException`.

**Antwort: A**
**Ausführliche Erklärung:**
- **Übergabe (submit) von Callable vs. Runnable:**
  - Der erste Task ist ein `Callable<Integer>`, da er einen Wert zurückgibt (`return 5`). `f1.get()` gibt `5` zurück.
  - Der zweite Task ist ein `Runnable`, da er keinen Wert zurückgibt (`void`). `f2.get()` blockiert bis zur Fertigstellung und gibt `null` zurück.
  - Das Runnable gibt `"Run "` aus. Danach gibt die main-Methode `5 null` aus. Die kombinierte Ausgabe lautet `Run 5 null`.

---

### Frage 9
Betrachten Sie das folgende Thread-Safety-Problem bei Parallel Streams:
```java
import java.util.*;

public class ParallelSafety {
    public static void main(String[] args) {
        List<Integer> target = new ArrayList<>();
        List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10).parallelStream()
            .forEach(target::add);
        System.out.println(target.size() == 10);
    }
}
```
Was ist die Folge der Ausführung dieses Codes?
- A. Gibt immer `true` aus.
- B. Gibt immer `false` aus.
- C. Kann `true` oder `false` ausgeben oder mit einer `ArrayIndexOutOfBoundsException` / `NullPointerException` abstürzen (Race Condition).
- D. Die Kompilierung schlägt fehl, da `ArrayList` keine parallelen Streams unterstützt.

**Antwort: C**
**Ausführliche Erklärung:**
- **Nicht-threadsichere Akkumulation:** `ArrayList` ist nicht threadsicher (thread-safe).
- Bei der Ausführung eines parallelen Streams fügen mehrere Threads gleichzeitig Elemente derselben `ArrayList` hinzu (`target::add`).
- Dies führt zu einer Race Condition (Wettlaufsituation), die Elemente überschreiben kann (was zu einer Größe $< 10$ führt), mit einer `ArrayIndexOutOfBoundsException`/`NullPointerException` abstürzen kann oder unvollständige Speicherzustände erzeugt.

---

### Frage 10
Was gibt der folgende Code aus?
```java
import java.util.concurrent.*;

public class CountDownLatchTest {
    public static void main(String[] args) throws Exception {
        CountDownLatch latch = new CountDownLatch(2);
        ExecutorService service = Executors.newFixedThreadPool(2);
        
        for (int i = 0; i < 2; i++) {
            service.submit(() -> {
                System.out.print("Count ");
                latch.countDown();
            });
        }
        
        latch.await();
        System.out.print("Done");
        service.shutdown();
    }
}
```
- A. Gibt `Done Count Count ` aus
- B. Gibt `Count Count Done` aus
- C. Hängt unbegrenzt.
- D. Gibt `Count Done Count` aus

**Antwort: B**
**Ausführliche Erklärung:**
- **Koordination mit CountDownLatch:** Das `CountDownLatch` startet mit einem Zähler (count) von `2`.
- Beide Threads verringern den Zähler des Latches mit `countDown()` (wobei `"Count "` ausgegeben wird).
- Der Haupt-Thread blockiert bei `latch.await()`, bis der Zähler `0` erreicht.
- Sobald beide Threads den Latch-Zähler dekrementiert haben, fährt der Haupt-Thread fort und gibt `"Done"` aus. Die Ausgabe ist immer `Count Count Done` (die Reihenfolge der "Count"-Ausgaben kann variieren, aber beide erscheinen vor "Done").

---

### Frage 11
Welche der folgenden Optionen lassen sich erfolgreich kompilieren und erstellen eine threadsichere Map? (Wählen Sie alle zutreffenden Antworten aus)
- A. `Map<String, String> map = new ConcurrentHashMap<>();`
- B. `Map<String, String> map = Collections.synchronizedMap(new HashMap<>());`
- C. `Map<String, String> map = new Hashtable<>();`
- D. `Map<String, String> map = Map.of();`

**Antwort: A, B, C, D**
**Ausführliche Erklärung:**
- **Threadsichere Maps:**
  - `ConcurrentHashMap` (A) verwendet feingranulares Locking (Sperren) und ist threadsicher.
  - `Collections.synchronizedMap` (B) hüllt eine Map in eine Synchronisierung auf Objektebene ein.
  - `Hashtable` (C) ist eine Legacy-Klasse, bei der alle Methoden synchronisiert sind.
  - `Map.of()` (D) gibt eine nicht modifizierbare (unmodifiable) Map zurück, die inhärent threadsicher (da unveränderlich / immutable) ist.

---

### Frage 12
Gegeben sei folgendes Code-Segment:
```java
ScheduledExecutorService service = Executors.newScheduledThreadPool(1);
service.scheduleAtFixedRate(() -> System.out.print("Run "), 1, 2, TimeUnit.SECONDS);
```
Was bewirkt diese Zeitplanung (Schedule)?
- A. Führt den Task einmal nach 1 Sekunde aus und stoppt dann.
- B. Führt den Task alle 2 Sekunden aus, beginnend nach einer anfänglichen Verzögerung von 1 Sekunde.
- C. Führt den Task jede Sekunde aus, mit einer Verzögerung von 2 Sekunden zwischen den Ausführungen.
- D. Führt den Task alle 3 Sekunden aus.

**Antwort: B**
**Ausführliche Erklärung:**
- **Parameter von scheduleAtFixedRate:**
  - Parameter 1: `Runnable command` (der auszuführende Task).
  - Parameter 2: `initialDelay` (`1` Sekunde Verzögerung vor der ersten Ausführung).
  - Parameter 3: `period` (Ausführung alle `2` Sekunden).
  - Parameter 4: `unit` (`TimeUnit.SECONDS`).
  - Somit startet der Task nach 1 Sekunde und wird alle 2 Sekunden wiederholt.

---

### Frage 13
Was ist das Ergebnis beim Kompilieren und Ausführen des folgenden Programms?
```java
import java.util.concurrent.*;

public class FutureException {
    public static void main(String[] args) {
        ExecutorService service = Executors.newSingleThreadExecutor();
        Future<Integer> future = service.submit(() -> {
            throw new RuntimeException("Error");
        });
        
        try {
            future.get();
        } catch (ExecutionException e) {
            System.out.println("ExecutionException: " + e.getCause().getMessage());
        } catch (Exception e) {
            System.out.println("Exception");
        }
        service.shutdown();
    }
}
```
- A. Das Programm bricht abrupt ab und wirft während `submit` eine `RuntimeException`.
- B. Gibt `ExecutionException: Error` aus.
- C. Gibt `Exception` aus.
- D. Kompiliert erfolgreich, hängt jedoch während `future.get()`.

**Antwort: B**
**Ausführliche Erklärung:**
- **Exception-Wrapping bei Future.get:** Wenn ein an einen Executor übergebener Task eine ungeprüfte Exception (unchecked exception) wirft, schlägt der Task fehl.
- Die Exception wird abgefangen und im `Future`-Objekt gespeichert.
- Erst wenn `future.get()` aufgerufen wird, wirft diese Methode eine `ExecutionException`, welche die ursprüngliche Exception als Ursache (cause) einhüllt. `e.getCause().getMessage()` gibt `"Error"` zurück.

---

### Frage 14
Welche Shutdown-Methode des `ExecutorService` unternimmt den besten Versuch, alle aktiv ausgeführten Tasks sofort zu stoppen?
- A. `shutdown()`
- B. `close()`
- C. `shutdownNow()`
- D. `awaitTermination(long, TimeUnit)`

**Antwort: C**
**Ausführliche Erklärung:**
- **Vergleich von shutdown und shutdownNow:**
  - `shutdown()` nimmt keine neuen Tasks mehr an, erlaubt aber bereits laufenden oder in der Warteschlange befindlichen Tasks, fertiggestellt zu werden.
  - `close()` verhält sich ähnlich wie `shutdown()`, gefolgt von `awaitTermination()`.
  - `shutdownNow()` versucht aktiv, laufende Tasks mittels `Thread.interrupt()` zu stoppen, und verwirft Tasks in der Warteschlange.
  - `awaitTermination` blockiert und wartet, bricht aber keine Tasks ab.

---

### Frage 15
Was ist die Ausgabe des folgenden Programms?
```java
import java.util.concurrent.*;

public class LockTryLock {
    public static void main(String[] args) throws Exception {
        ReentrantLock lock = new ReentrantLock();
        lock.lock();
        
        Thread t = new Thread(() -> {
            boolean acquired = lock.tryLock();
            System.out.print(acquired + " ");
        });
        t.start();
        t.join();
        lock.unlock();
    }
}
```
- A. Gibt `true ` aus
- B. Gibt `false ` aus
- C. Wirft zur Laufzeit eine `IllegalMonitorStateException`.
- D. Die Kompilierung schlägt fehl, da `tryLock` eine geprüfte Exception (checked exception) wirft.

**Antwort: B**
**Ausführliche Erklärung:**
- **Nicht-blockierendes Verhalten von tryLock:** Die Methode `tryLock()` versucht, den Lock zu erwerben. Wenn der Lock von einem anderen Thread gehalten wird (hier dem Haupt-Thread), gibt `tryLock()` sofort `false` zurück, ohne zu blockieren.

---

### Frage 16
Was ist das Ergebnis beim Versuch, den folgenden Code zu kompilieren und auszuführen?
```java
import java.util.concurrent.ForkJoinPool;

public class ForkJoinTest {
    public static void main(String[] args) {
        ForkJoinPool pool = ForkJoinPool.commonPool();
        System.out.println(pool.getParallelism() > 0);
    }
}
```
- A. Kompiliert und gibt `true` aus.
- B. Die Kompilierung schlägt fehl, da `commonPool()` privat ist.
- C. Wirft zur Laufzeit eine `UnsupportedOperationException`.
- D. Gibt `false` aus, da der Parallelitätsgrad von commonPool 0 ist.

**Antwort: A**
**Ausführliche Erklärung:**
- **Gemeinsamer Pool von ForkJoinPool (commonPool):** Der gemeinsame Pool der JVM wird für parallele Streams und `CompletableFuture` verwendet.
- Die Methode `commonPool()` ist öffentlich (public) und statisch (static).
- Der Parallelitätsgrad ist standardmäßig auf die Anzahl der CPU-Kerne minus eins festgelegt (fast immer $> 0$, wodurch `true` ausgegeben wird).

---

### Frage 17
Gegeben sei der folgende Lock-Versuch:
```java
ReentrantLock lock = new ReentrantLock();
// Thread 1
lock.lock();
lock.lock();
// Line X
lock.unlock();
```
Wenn Thread 2 versucht, `lock.lock()` an Zeile X aufzurufen, was passiert?
- A. Thread 2 erhält den Lock.
- B. Thread 2 blockiert, bis ein weiteres `unlock()` aufgerufen wird.
- C. Thread 2 wirft eine `DeadlockException`.
- D. Zeile X wirft eine `IllegalMonitorStateException`, da der Lock bereits gesperrt war.

**Antwort: B**
**Ausführliche Erklärung:**
- **Reentrantes (wiedereintretbares) Verhalten:** Ein `ReentrantLock` erlaubt es dem besitzenden Thread, diesen mehrfach zu sperren. Der interne Hold-Count (Sperrenzähler) erhöht sich auf `2`.
- Um den Lock vollständig für andere Threads freizugeben, muss der besitzende Thread `unlock()` genauso oft aufrufen, wie `lock()` aufgerufen wurde.
- An Zeile X wurde `unlock()` erst einmal aufgerufen (Hold-Count = 1), sodass der Lock weiterhin gesperrt bleibt. Thread 2 blockiert.

---

### Frage 18
Welcher der folgenden Thread-Zustände gehört NICHT zum Enum `Thread.State`?
- A. `RUNNABLE`
- B. `BLOCKED`
- C. `WAITING`
- D. `RUNNING`
- E. `TERMINATED`

**Antwort: D**
**Ausführliche Erklärung:**
- **Thread-Zustände:** Die Zustände im Enum `Thread.State` sind:
  - `NEW`, `RUNNABLE`, `BLOCKED`, `WAITING`, `TIMED_WAITING`, `TERMINATED`.
  - Es gibt keinen Zustand `RUNNING` in diesem Enum. Ein laufender Thread befindet sich im Zustand `RUNNABLE`.

---

### Frage 19
Was ist das Ergebnis beim Versuch, den folgenden Code unter Java 21 zu kompilieren und auszuführen?
```java
import java.util.concurrent.*;

public class VirtualThreadPool {
    public static void main(String[] args) {
        try (var executor = Executors.newFixedThreadPool(10)) {
            // Task submission
            System.out.println("Success");
        }
    }
}
```
- A. Kompiliert und gibt `Success` aus.
- B. Die Kompilierung schlägt fehl, da `newFixedThreadPool` keinen `AutoCloseable`-Executor zurückgibt.
- C. Wirft zur Laufzeit eine `UnsupportedOperationException`.
- D. Hängt unbegrenzt.

**Antwort: A**
**Ausführliche Erklärung:**
- **AutoCloseable-ExecutorService:** Seit Java 19 implementiert `ExecutorService` das Interface `AutoCloseable`.
- Jeder von `Executors` zurückgegebene Executor kann in einer Try-with-Resources-Anweisung verwendet werden, unabhängig davon, ob er virtuelle oder Plattform-Threads nutzt.

---

### Frage 20
Was ist das Ergebnis beim Kompilieren und Ausführen des folgenden Programms?
```java
import java.util.concurrent.atomic.AtomicBoolean;

public class AtomicBooleanTest {
    public static void main(String[] args) {
        AtomicBoolean flag = new AtomicBoolean(false);
        boolean val1 = flag.getAndSet(true);
        boolean val2 = flag.compareAndSet(true, false);
        System.out.println(val1 + " " + val2 + " " + flag.get());
    }
}
```
- A. `false true false`
- B. `true true false`
- C. `false false true`
- D. `true false true`

**Antwort: A**
**Ausführliche Erklärung:**
- **AtomicBoolean-Operationen:**
  - `flag` startet als `false`.
  - `getAndSet(true)` setzt den Wert auf `true` und gibt den alten Wert (`false`) zurück -> `val1 = false`.
  - `compareAndSet(true, false)` prüft, ob der Wert `true` ist (was zutrifft) und setzt ihn auf `false`, wobei `true` zurückgegeben wird -> `val2 = true`.
  - Der aktuelle Zustand ist `false`.
  - Die Ausgabe lautet `false true false`.
