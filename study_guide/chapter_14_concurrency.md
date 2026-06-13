# Chapter 14: Concurrency & Virtual Threads

## 1. Core Java 21 Exam Objectives
- Understand multi-threading concepts, the `Thread` lifecycle, and task execution using `Runnable` and `Callable`.
- Manage thread pools using `ExecutorService` and concurrent utilities.
- Write thread-safe code using the `synchronized` keyword and concurrent collections.
- Describe platform threads vs. Java 21 **Virtual Threads** (Project Loom).
- Master **Thread Pinning** and JVM virtual thread scheduling internals.

---

## 2. Deep-Dive Concepts

### Platform Threads vs. Virtual Threads
Java 21 introduced **Virtual Threads** as a lightweight alternative to traditional threads:
- **Platform Threads:** Standard Java threads mapped 1:1 to OS-level threads. They are heavy, resource-expensive (requiring ~1MB stack space), and context switches require OS-kernel involvement.
- **Virtual Threads:** Lightweight threads managed by the **JVM Runtime**, not the OS. They run on top of a pool of platform threads (known as **Carrier Threads**). They require bytes of memory instead of megabytes, allowing you to run millions of them concurrently.

### Thread Pinning
When a virtual thread executes a blocking operation (e.g., waiting for network IO or file access), the JVM scheduler automatically **unmounts** the virtual thread from its platform **Carrier Thread**, leaving the carrier thread free to run other virtual threads.
However, in certain scenarios, the virtual thread becomes **pinned** to its carrier thread:
- **Inside `synchronized` blocks or methods:** If a virtual thread enters a `synchronized` block, it cannot be unmounted.
- **Inside Native Calls:** If executing JNI code.
- *Impact:* While a thread is pinned, its carrier thread is blocked. If all carrier threads become pinned, the JVM cannot run any other virtual threads, negating the performance benefits of Project Loom.
- *Solution:* Replace `synchronized` blocks with **`ReentrantLock`** from `java.util.concurrent.locks`.

---

## 3. JVM Internals & Memory Layout

### Virtual Thread Mounting and Scheduling
The JVM uses a dedicated **ForkJoinPool** as its scheduler to run virtual threads.
1. **Mounting:** The JVM scheduler assigns a virtual thread to a platform **Carrier Thread**. The virtual thread's stack frames are copied from the Heap to the carrier thread's execution stack.
2. **Unmounting (Yielding):** When the virtual thread blocks (e.g., `Thread.sleep` or socket read), it yields. The JVM copies its stack frames back to the Heap and frees the carrier thread.

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

## 4. Tricky OCP Exam Questions

### Question 1
What is the result of executing the following code segment under Java 21?
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
- A. Prints `Daemon set`
- B. Prints `IAE`
- C. Prints `Exception`
- D. Compilation fails because `setDaemon` is not available on virtual threads.

**Answer: B**
**Detailed Explanation:**
- **Virtual Threads Daemon Constraints:** By design, virtual threads are always **daemon threads** and this property cannot be changed.
- The `setDaemon(boolean)` method exists on the `Thread` class (so the code compiles), but calling it with `false` on a virtual thread throws an `IllegalArgumentException` at runtime.

---

### Question 2
Consider the following program that uses `ExecutorService`:
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
- A. Prints `0`
- B. Prints `1`
- C. Prints `Interrupted 0`
- D. Prints `Interrupted 1`

**Answer: C**
**Detailed Explanation:**
- **shutdownNow Behavior:** The `shutdownNow()` method attempts to stop all actively executing tasks by interrupting them and returns a list of tasks that were **awaiting execution** in the queue.
- Since we use a `SingleThreadExecutor` and the only submitted task is already running (sleeping for 5 seconds), the task queue is empty.
- Therefore, `shutdownNow()` returns an empty list (`unexecuted.size() == 0`).
- Meanwhile, the shutdown interrupts the running task, throwing an `InterruptedException` which prints `"Interrupted "`. The output is `Interrupted 0`.

---

### Question 3
What is the output of the following program?
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

**Answer: A**
**Detailed Explanation:**
- **CopyOnWriteArrayList Iterator mechanics:**
  - The iterator of a `CopyOnWriteArrayList` operates on a **snapshot copy** of the underlying array as it existed when the iterator was created.
  - Subsequent modifications to the list (`list.add("C")`) are not reflected in the iterator. Therefore, the iterator only traverses `"A"` and `"B"`.
  - The iterator returned by `CopyOnWriteArrayList` is strictly read-only. Any attempt to call `it.remove()` throws an `UnsupportedOperationException` (printing `UOE`).

---

### Question 4
What is the result of compiling and running the following program?
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
- A. Prints `Barrier Passed Passed `
- B. Prints `Passed Passed `
- C. The program compiles and hangs indefinitely without printing anything.
- D. Throws a `TimeoutException` at runtime.

**Answer: C**
**Detailed Explanation:**
- **CyclicBarrier parties alignment:** A `CyclicBarrier` is initialized with a fixed number of parties (here `3`). This means exactly `3` threads must call `await()` for the barrier to trip.
- In this code, only `2` tasks calling `await()` are submitted. Since the third party never calls `await()`, both threads wait indefinitely.
- The program hangs and prints nothing.

---

### Question 5
What is the output of executing the following program?
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

**Answer: A**
**Detailed Explanation:**
- **AtomicInteger Operations:**
  - `value` starts at `10`.
  - `getAndIncrement()` returns the old value (`10`) and increments the internal state to `11` (`val1 = 10`).
  - `incrementAndGet()` increments the value to `12` first and then returns this new value (`val2 = 12`).
  - `compareAndSet(12, 20)` checks if the current value is `12`. Since it is, it sets the value to `20` and returns `true`.
  - The output is `10 12 true 20`.

---

### Question 6
Which of the following descriptions are true regarding Virtual Thread Pinning? (Choose all that apply)
- A. A virtual thread is pinned when it enters a native method call.
- B. A virtual thread is pinned when executing inside a `synchronized` block or method.
- C. Pinning causes the OS thread to terminate.
- D. Pinning blocks the carrier platform thread, preventing it from running other virtual threads.

**Answer: A, B, D**
**Detailed Explanation:**
- **Thread Pinning Internals:**
  - When a virtual thread blocks (e.g. on I/O), the JVM scheduler unmounts it from the carrier platform thread so it can run other tasks.
  - However, if the virtual thread is executing inside a `synchronized` block/method (B) or calling native code via JNI (A), it cannot be unmounted. It is considered **pinned**.
  - While pinned, the carrier platform thread is physically blocked (D), which negates the scaling benefits of Project Loom.
  - The OS thread is not terminated (C).

---

### Question 7
What is the result of attempting to compile and run the following code?
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
- A. Prints `Locked` followed by compilation failure.
- B. Prints `Locked Unlocked` and terminates with a `RuntimeException`.
- C. Prints `Locked` and hangs indefinitely.
- D. Prints `Locked Unlocked` and terminates normally.

**Answer: B**
**Detailed Explanation:**
- **Finally block execution:** The `finally` block is guaranteed to execute, regardless of whether an exception is thrown in the `try` block.
- The lock is successfully released in the `finally` block and `"Unlocked"` is printed, before the uncaught `RuntimeException` terminates the program.

---

### Question 8
What is the output of compiling and running the following program?
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
- A. Prints `Run 5 null`
- B. Prints `5 Run null`
- C. Compilation fails because `submit` with lambda is ambiguous.
- D. Throws `ExecutionException` at runtime.

**Answer: A**
**Detailed Explanation:**
- **Callable vs Runnable submit:**
  - The first task is a `Callable<Integer>` because it returns a value (`return 5`). `f1.get()` returns `5`.
  - The second task is a `Runnable` because it does not return a value (`void`). `f2.get()` blocks until completion and returns `null`.
  - The Runnable prints `"Run "`. Then the main method prints `5 null`. The combined output is `Run 5 null`.

---

### Question 9
Consider the following thread-safety concern with Parallel Streams:
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
What is the consequence of running this code?
- A. Prints `true` always.
- B. Prints `false` always.
- C. May print `true`, `false`, or crash with `ArrayIndexOutOfBoundsException` / `NullPointerException` (race condition).
- D. Compilation fails because `ArrayList` does not support parallel streams.

**Answer: C**
**Detailed Explanation:**
- **Non-Thread-Safe Accumulation:** `ArrayList` is not thread-safe.
- When running a parallel stream, multiple threads concurrently add elements to the same `ArrayList` (`target::add`).
- This causes a race condition, which can overwrite elements (resulting in a size $< 10$), crash with `ArrayIndexOutOfBoundsException`/`NullPointerException`, or produce incomplete memory states.

---

### Question 10
What does the following code print?
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
- A. Prints `Done Count Count `
- B. Prints `Count Count Done`
- C. Hangs indefinitely.
- D. Prints `Count Done Count`

**Answer: B**
**Detailed Explanation:**
- **CountDownLatch coordination:** The `CountDownLatch` starts with a count of `2`.
- Both threads decrement the latch count using `countDown()` (printing `"Count "`).
- The main thread blocks at `latch.await()` until the count reaches `0`.
- Once both threads decrement the latch, the main thread resumes and prints `"Done"`. The output is always `Count Count Done` (the order of "Count" prints may vary, but both appear before "Done").

---

### Question 11
Which of the following options compiles successfully and creates a thread-safe Map? (Choose all that apply)
- A. `Map<String, String> map = new ConcurrentHashMap<>();`
- B. `Map<String, String> map = Collections.synchronizedMap(new HashMap<>());`
- C. `Map<String, String> map = new Hashtable<>();`
- D. `Map<String, String> map = Map.of();`

**Answer: A, B, C, D**
**Detailed Explanation:**
- **Thread-safe Maps:**
  - `ConcurrentHashMap` (A) uses fine-grained locking and is thread-safe.
  - `Collections.synchronizedMap` (B) wraps a map with object-level synchronization.
  - `Hashtable` (C) is a legacy class where all methods are synchronized.
  - `Map.of()` (D) returns an unmodifiable map, which is inherently thread-safe (immutable).

---

### Question 12
Given the code segment:
```java
ScheduledExecutorService service = Executors.newScheduledThreadPool(1);
service.scheduleAtFixedRate(() -> System.out.print("Run "), 1, 2, TimeUnit.SECONDS);
```
What does this schedule do?
- A. Runs the task once after 1 second, then stops.
- B. Runs the task every 2 seconds, starting after an initial delay of 1 second.
- C. Runs the task every 1 second, with a delay of 2 seconds between executions.
- D. Runs the task every 3 seconds.

**Answer: B**
**Detailed Explanation:**
- **scheduleAtFixedRate Parameters:**
  - Parameter 1: `Runnable command` (task to run).
  - Parameter 2: `initialDelay` (`1` second delay before first execution).
  - Parameter 3: `period` (execute every `2` seconds).
  - Parameter 4: `unit` (`TimeUnit.SECONDS`).
  - Thus, the task starts after 1 second and repeats every 2 seconds.

---

### Question 13
What is the result of compiling and running the following program?
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
- A. The program terminates abruptly throwing a `RuntimeException` during `submit`.
- B. Prints `ExecutionException: Error`.
- C. Prints `Exception`.
- D. Compiles successfully but hangs during `future.get()`.

**Answer: B**
**Detailed Explanation:**
- **Future.get Exception Wrapping:** When a task submitted to an executor throws an unchecked exception, the task fails.
- The exception is captured and stored inside the `Future` object.
- Only when `future.get()` is invoked does it throw an `ExecutionException`, wrapping the original exception as the cause. `e.getCause().getMessage()` returns `"Error"`.

---

### Question 14
Which ExecutorService shutdown method makes the best effort to stop all actively executing tasks immediately?
- A. `shutdown()`
- B. `close()`
- C. `shutdownNow()`
- D. `awaitTermination(long, TimeUnit)`

**Answer: C**
**Detailed Explanation:**
- **shutdown vs shutdownNow:**
  - `shutdown()` stops accepting new tasks but allows running/queued tasks to finish.
  - `close()` behaves similarly to `shutdown()` followed by `awaitTermination()`.
  - `shutdownNow()` actively attempts to stop running tasks via `Thread.interrupt()` and discards queued tasks.
  - `awaitTermination` blocks and waits but does not cancel tasks.

---

### Question 15
What is the output of the following code program?
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
- A. Prints `true `
- B. Prints `false `
- C. Throws `IllegalMonitorStateException` at runtime.
- D. Compilation fails because `tryLock` throws a checked exception.

**Answer: B**
**Detailed Explanation:**
- **tryLock non-blocking behavior:** The `tryLock()` method attempts to acquire the lock. If the lock is held by another thread (the main thread), `tryLock()` returns `false` immediately without blocking.

---

### Question 16
What is the result of attempting to compile and run the following code?
```java
import java.util.concurrent.ForkJoinPool;

public class ForkJoinTest {
    public static void main(String[] args) {
        ForkJoinPool pool = ForkJoinPool.commonPool();
        System.out.println(pool.getParallelism() > 0);
    }
}
```
- A. Compiles and prints `true`.
- B. Compilation fails because `commonPool()` is private.
- C. Throws `UnsupportedOperationException` at runtime.
- D. Prints `false` because commonPool parallel level is 0.

**Answer: A**
**Detailed Explanation:**
- **ForkJoinPool common pool:** The JVM common pool is used for parallel streams and CompletableFuture.
- The `commonPool()` method is public and static.
- The parallelism level defaults to the number of CPU cores minus one (almost always $> 0$, printing `true`).

---

### Question 17
Given the following lock attempt:
```java
ReentrantLock lock = new ReentrantLock();
// Thread 1
lock.lock();
lock.lock();
// Line X
lock.unlock();
```
If Thread 2 attempts to call `lock.lock()` at Line X, what happens?
- A. Thread 2 acquires the lock.
- B. Thread 2 blocks until another `unlock()` is called.
- C. Thread 2 throws a `DeadlockException`.
- D. Line X throws `IllegalMonitorStateException` because the lock was already locked.

**Answer: B**
**Detailed Explanation:**
- **Reentrant behavior:** `ReentrantLock` allows the holding thread to lock it multiple times. The internal hold count increases to `2`.
- To fully release the lock for other threads, the holding thread must call `unlock()` the same number of times as `lock()` was called.
- At Line X, `unlock()` was only called once (hold count = 1), so the lock remains locked. Thread 2 blocks.

---

### Question 18
Which of the following thread states does NOT belong to the `Thread.State` enum?
- A. `RUNNABLE`
- B. `BLOCKED`
- C. `WAITING`
- D. `RUNNING`
- E. `TERMINATED`

**Answer: D**
**Detailed Explanation:**
- **Thread States:** The states in the `Thread.State` enum are:
  - `NEW`, `RUNNABLE`, `BLOCKED`, `WAITING`, `TIMED_WAITING`, `TERMINATED`.
  - There is no `RUNNING` state in the enum. A running thread is in the `RUNNABLE` state.

---

### Question 19
What is the result of attempting to compile and run the following code under Java 21?
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
- A. Compiles and prints `Success`.
- B. Compilation fails because `newFixedThreadPool` does not return an AutoCloseable executor.
- C. Throws `UnsupportedOperationException` at runtime.
- D. Hangs infinitely.

**Answer: A**
**Detailed Explanation:**
- **AutoCloseable ExecutorService:** Since Java 19, `ExecutorService` implements `AutoCloseable`.
- Any executor returned by `Executors` can be used within a try-with-resources statement, regardless of whether it uses virtual or platform threads.

---

### Question 20
What is the result of compiling and running the following program?
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

**Answer: A**
**Detailed Explanation:**
- **AtomicBoolean operations:**
  - `flag` starts as `false`.
  - `getAndSet(true)` sets the value to `true` and returns the old value (`false`) -> `val1 = false`.
  - `compareAndSet(true, false)` checks if the value is `true` (it is) and sets it to `false`, returning `true` -> `val2 = true`.
  - The current state is `false`.
  - The output is `false true false`.er aktuelle Zustand ist `false`.
  - Die Ausgabe lautet `false true false`.

