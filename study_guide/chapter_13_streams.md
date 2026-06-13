# Chapter 13: Functional Programming & Streams API

## 1. Core Java 21 Exam Objectives
- Write Lambda expressions and map them to built-in Functional Interfaces.
- Master standard functional interfaces: `Predicate`, `Consumer`, `Supplier`, `Function`, `UnaryOperator`, and `BinaryOperator`.
- Use the `Optional` class to handle null safety.
- Understand the Streams API: pipeline creation, intermediate lazy operations, and terminal eager operations.
- Detail the behavior of parallel streams.

---

## 2. Deep-Dive Concepts

### Standard Functional Interfaces
A functional interface has exactly one abstract method. Java 8 provided the `java.util.function` package containing 43 standard functional interfaces. The core ones are:

| Interface | Abstract Method | Parameters | Returns | Example |
| :--- | :--- | :--- | :--- | :--- |
| **`Predicate<T>`** | `boolean test(T t)` | 1 ($T$) | `boolean` | Is a book price $> \$50$? |
| **`Consumer<T>`** | `void accept(T t)` | 1 ($T$) | `void` | Print a book details. |
| **`Supplier<T>`** | `T get()` | 0 | $T$ | Instantiate a new ArrayList. |
| **`Function<T, R>`** | `R apply(T t)` | 1 ($T$) | $R$ | Extract String title from Book. |
| **`UnaryOperator<T>`** | `T apply(T t)` | 1 ($T$) | $T$ (Same type) | Double a price: $x \rightarrow x \times 2$. |
| **`BinaryOperator<T>`**| `T apply(T t1, T t2)`| 2 ($T, T$) | $T$ (Same type) | Add two integers. |

### Stream Pipeline: Lazy vs. Eager
A Stream pipeline is a sequence of data processing operations.
1. **Source:** A collection, array, or file generator.
2. **Intermediate Operations (Lazy):** Transform the stream into another stream. They do **not** perform any processing when called. Instead, they record the operation in a pipeline chain. Examples: `filter()`, `map()`, `sorted()`, `distinct()`, `limit()`.
3. **Terminal Operations (Eager):** Execute the entire pipeline and return a result (or void). Examples: `collect()`, `forEach()`, `count()`, `findFirst()`, `reduce()`.
- *OCP Trap:* If you construct a stream with multiple intermediate operations but do not invoke a terminal operation, **no elements are processed**, and any print statements inside your filters will not run!

---

## 3. JVM Internals & Memory Layout

### Lambda Compilation: `invokedynamic`
Prior to Java 8, implementing behavior-passing required anonymous inner classes, which compiled to separate `.class` files, bloated jar size, and required constructor overhead on the Heap.
- Lambdas do **not** compile into anonymous inner classes.
- Instead, the Java compiler compiles the lambda code into a private synthetic method inside the same class.
- The compiler inserts an **`invokedynamic` (Indy)** bytecode instruction at the call site.
- When the JVM executes `invokedynamic` at runtime, it calls a bootstrap method (`LambdaMetafactory.metafactory`), which dynamically creates a call site pointing to a lightweight functional object wrapping the synthetic method.
- This dynamic generation avoids extra `.class` file generation and significantly reduces memory overhead.

```
+--------------------------------------------------------------+
| LAMBDA COMPILATION FLOW                                      |
|                                                              |
| Source Code:                                                 |
| list.forEach(x -> System.out.println(x));                    |
|                                                              |
| Bytecode representation:                                     |
| 1. Lambda code put in: private static synthetic void lambda$0|
| 2. Call site uses: invokedynamic instruction                 |
| 3. Runtime links dynamically via LambdaMetafactory           |
+--------------------------------------------------------------+
```

---

### 4. Tricky OCP Exam Questions

### Question 1
What is the result of attempting to compile and run the following code?
```java
import java.util.function.Consumer;

public class LambdaScope {
    public static void main(String[] args) {
        int x = 10;
        Consumer<Integer> c = val -> {
            System.out.println(val + x);
        };
        x = 20;
        c.accept(5);
    }
}
```
- A. Compiles successfully and prints `15`.
- B. Compiles successfully and prints `25`.
- C. Compilation fails because `x` is modified and is no longer effectively final.
- D. Compilation fails because variables defined in `main` cannot be accessed in a lambda.

**Answer: C**
**Explanation (German/English):**
- **Effectively Final Restriction:** Variablen, die aus einer Lambda-Expression heraus referenziert werden, müssen entweder explizit als `final` deklariert sein oder **effektiv final** (effectively final) sein.
- Eine Variable ist effektiv final, wenn ihr Wert nach der Initialisierung nie verändert wird.
- Da `x` nach der Lambda-Definition auf `20` geändert wird (`x = 20;`), verliert sie ihren Status als "effectively final". Der Compiler bricht den Kompilierungsvorgang an der Stelle des Lambda-Ausdrucks ab ("local variables referenced from a lambda expression must be final or effectively final").

---

### Question 2
Which of the following lambda expressions compile successfully? (Choose all that apply)
- A. `BiFunction<String, String, String> f1 = (var x, y) -> x + y;`
- B. `BiFunction<String, String, String> f2 = (var x, var y) -> x + y;`
- C. `BiFunction<String, String, String> f3 = (String x, var y) -> x + y;`
- D. `BiFunction<String, String, String> f4 = (x, y) -> x + y;`
- E. `BiFunction<String, String, String> f5 = x, y -> x + y;`

**Answer: B, D**
**Explanation (German/English):**
- **Lambda Parameter Rules:** Für die Deklaration von Lambda-Parametern gelten strenge Konsistenzregeln:
  - **Option A fails:** Es ist verboten, implizite (`y`) und mit `var` deklarierte (`var x`) Parameter zu mischen.
  - **Option B compiles:** Die Verwendung von `var` für alle Parameter ist erlaubt (Java 11+).
  - **Option C fails:** Es ist verboten, explizite Typen (`String x`) und `var` (`var y`) zu mischen.
  - **Option D compiles:** Die Auslassung aller Typen (vollständige Typinferenz) ist der Standard und vollkommen legal.
  - **Option E fails:** Klammern um die Parameter sind zwingend erforderlich, sobald mehr als ein Parameter deklariert wird (auch bei null Parametern).

---

### Question 3
What is the output of the following program?
```java
import java.util.Optional;

public class OptionalTest {
    public static String getDefault() {
        System.out.print("Called ");
        return "Default";
    }
    
    public static void main(String[] args) {
        Optional<String> opt = Optional.of("Present");
        System.out.print("1: ");
        opt.orElse(getDefault());
        System.out.print("2: ");
        opt.orElseGet(() -> getDefault());
    }
}
```
- A. `1: Called 2: Called`
- B. `1: 2:`
- C. `1: Called 2:`
- D. `1: 2: Called`

**Answer: C**
**Detailed Explanation:**
- **orElse vs orElseGet Evaluation:**
  - `orElse(T other)` evaluates its argument (`getDefault()`) **eagerly**, regardless of whether the `Optional` contains a value or not. Since the `Optional` is not empty (it contains `"Present"`), `"Called "` is printed, but the default value is ignored.
  - `orElseGet(Supplier<? extends T> other)` evaluates its argument **lazily**. The supplier is only executed if the `Optional` is empty. Because the `Optional` contains a value, the supplier is not called in step 2.

---

### Question 4
What is the result of executing the following code?
```java
import java.util.stream.Stream;

public class StreamReuse {
    public static void main(String[] args) {
        Stream<Integer> stream = Stream.of(1, 2, 3);
        stream.forEach(System.out::print);
        try {
            long count = stream.count();
            System.out.print(" Count: " + count);
        } catch (IllegalStateException e) {
            System.out.print(" ISE");
        }
    }
}
```
- A. `123 Count: 3`
- B. `123 ISE`
- C. `123` followed by a compilation error.
- D. `ISE`

**Answer: B**
**Detailed Explanation:**
- **Stream Lifecycle:** A Java stream can only be operated on **once**.
- As soon as a terminal operation (such as `forEach`) is invoked, the stream is considered consumed and closed.
- Any subsequent attempt to call another operation (intermediate or terminal, like `count()`) on the same stream object will throw an `IllegalStateException` at runtime (printing `ISE`).

---

### Question 5
What does the following stream pipeline print when executed?
```java
import java.util.stream.Stream;

public class StreamTrace {
    public static void main(String[] args) {
        Stream<Integer> stream = Stream.iterate(1, i -> i + 1);
        boolean match = stream.filter(i -> i % 2 == 0)
                              .peek(System.out::print)
                              .anyMatch(i -> i > 3);
        System.out.println(" " + match);
    }
}
```
- A. `2 4 true`
- B. `2 4 6 true`
- C. Runs infinitely without printing.
- D. `2 4` followed by an infinite loop.

**Answer: A**
**Detailed Explanation:**
- **Short-Circuiting Behavior:**
  - `Stream.iterate(1, i -> i + 1)` generates an infinite stream of integers: `1, 2, 3, 4, 5, ...`
  - The filter only passes even numbers.
  - `1` is filtered out.
  - `2` passes the filter, is printed by `peek()`, and evaluated by `anyMatch(i > 3)` as `false`.
  - `3` is filtered out.
  - `4` passes the filter, is printed by `peek()`, and evaluated by `anyMatch(i > 3)` as `true`.
  - Since `anyMatch` is a short-circuiting terminal operation, evaluation stops immediately once `true` is resolved. The infinite stream stops, and the program prints `2 4 true`.

---

### Question 6
What is the result of attempting to compile and run the following code?
```java
import java.util.stream.IntStream;

public class PrimitiveStream {
    public static void main(String[] args) {
        IntStream stream = IntStream.range(1, 4);
        int sum = stream.sum();
        double avg = stream.average().orElse(0.0);
        System.out.println(sum + " " + avg);
    }
}
```
- A. `6 2.0`
- B. `6 0.0`
- C. Throws `IllegalStateException` at runtime.
- D. Compilation fails because `average()` returns `OptionalDouble` which cannot chain `orElse(double)`.

**Answer: C**
**Detailed Explanation:**
- As explained in Question 4, a primitive stream (`IntStream`) cannot be reused once a terminal operation has been invoked.
- `stream.sum()` is a terminal operation and closes the stream.
- Calling `stream.average()` after this throws an `IllegalStateException`. To perform both operations, two separate streams must be created.

---

### Question 7
What is the outcome of compiling and running this code?
```java
import java.util.*;
import java.util.stream.Collectors;

public class ToMapTest {
    public static void main(String[] args) {
        List<String> list = List.of("apple", "banana", "apricot");
        try {
            Map<Integer, String> map = list.stream().collect(
                Collectors.toMap(String::length, s -> s)
            );
            System.out.println("Success: " + map.size());
        } catch (Exception e) {
            System.out.println(e.getClass().getSimpleName());
        }
    }
}
```
- A. `Success: 2`
- B. `Success: 3`
- C. `IllegalStateException`
- D. `IllegalArgumentException`

**Answer: C**
**Detailed Explanation:**
- **Collectors.toMap Collision:** By default, `toMap(keyMapper, valueMapper)` throws an `IllegalStateException` at runtime if duplicate keys are encountered.
- Both `"apple"` and `"apricot"` have a length of `5`, resulting in a collision for the key `5`.
- Without providing a merge function (e.g. `(s1, s2) -> s1`), the collector throws an `IllegalStateException`.

---

### Question 8
What is the result of executing the following program?
```java
import java.util.*;
import java.util.stream.Collectors;

public class PartitioningTest {
    public static void main(String[] args) {
        List<String> list = List.of("A", "BB", "CCC");
        Map<Boolean, Long> map = list.stream().collect(
            Collectors.partitioningBy(s -> s.length() > 1, Collectors.counting())
        );
        System.out.println(map.get(true) + " " + map.get(false));
    }
}
```
- A. `2 1`
- B. `1 2`
- C. Compilation fails because `partitioningBy` always returns a `Map<Boolean, List<T>>`.
- D. Throws ClassCastException at runtime.

**Answer: A**
**Detailed Explanation:**
- **partitioningBy with Downstream Collector:**
  - `partitioningBy(Predicate)` splits elements into a `Map<Boolean, List<T>>`.
  - However, when a downstream collector such as `Collectors.counting()` is supplied, the lists are replaced by the collection result. Here, `counting()` counts the elements in each partition.
  - `"BB"` and `"CCC"` satisfy `length() > 1` -> `2` elements for `true`.
  - `"A"` does not satisfy `length() > 1` -> `1` element for `false`.
  - The output is `2 1`.

---

### Question 9
Consider the following stream pipeline:
```java
import java.util.List;

public class ParallelStreamTest {
    public static void main(String[] args) {
        List<Integer> list = List.of(1, 2, 3, 4, 5);
        list.parallelStream()
            .forEachOrdered(System.out::print);
    }
}
```
Which of the following is true about this execution?
- A. The output will always be `12345` in order.
- B. The output order is non-deterministic (e.g. `31524`).
- C. The code fails to compile because `forEachOrdered` is only available on sequential streams.
- D. The output will always be sorted in descending order.

**Answer: A**
**Detailed Explanation:**
- **forEach vs forEachOrdered:**
  - `forEach` performs actions non-deterministically (out of order) on parallel streams to maximize performance.
  - `forEachOrdered` guarantees that the stream elements are processed in the encounter order of the source, even on a parallel stream.
  - Therefore, the output is guaranteed to be `12345` in order.

---

### Question 10
What does the following code print?
```java
import java.util.stream.IntStream;

public class RangeTest {
    public static void main(String[] args) {
        long count1 = IntStream.range(1, 5).count();
        long count2 = IntStream.rangeClosed(1, 5).count();
        System.out.println(count1 + " " + count2);
    }
}
```
- A. `5 5`
- B. `4 5`
- C. `4 4`
- D. `5 4`

**Answer: B**
**Detailed Explanation:**
- **IntStream Range Methods:**
  - `IntStream.range(start, end)` produces a sequential stream from `start` (inclusive) to `end` (**exclusive**). `range(1, 5)` generates `1, 2, 3, 4` (size 4).
  - `IntStream.rangeClosed(start, end)` produces a sequential stream from `start` (inclusive) to `end` (**inclusive**). `rangeClosed(1, 5)` generates `1, 2, 3, 4, 5` (size 5).

---

### Question 11
What is the result of attempting to compile the following code?
```java
import java.util.List;
import java.util.stream.Stream;

public class FlatMapTest {
    public static void main(String[] args) {
        List<List<String>> list = List.of(List.of("A"), List.of("B"));
        Stream<String> stream = list.stream().flatMap(subList -> subList.get(0));
        stream.forEach(System.out::print);
    }
}
```
- A. Compiles and prints `AB`.
- B. Compilation fails because `flatMap` must return a `Stream` object, not a String.
- C. Compilation fails because `flatMap` is not defined on `Stream<List<String>>`.
- D. Throws ClassCastException at runtime.

**Answer: B**
**Detailed Explanation:**
- **flatMap Return Type Requirement:** The mapper function passed to `flatMap` must return a **`Stream`** object (e.g., `subList.stream()`), not a single element.
- Since `subList.get(0)` returns a `String`, the code fails to compile.

---

### Question 12
Which of the following functional interfaces from `java.util.function` accept two arguments and return a primitive value? (Choose all that apply)
- A. `BiFunction<T, U, Integer>`
- B. `ToIntBiFunction<T, U>`
- C. `ObjIntConsumer<T>`
- D. `DoubleBinaryOperator`

**Answer: B, D**
**Detailed Explanation:**
- **Primitive Functional Interfaces:**
  - `BiFunction<T, U, Integer>` accepts two objects and returns a boxed `Integer` object, not a primitive value.
  - `ToIntBiFunction<T, U>` has the abstract method `applyAsInt(T, U)` which returns a primitive `int`.
  - `ObjIntConsumer<T>` accepts two arguments (an object and a primitive `int`) and returns `void` (a consumer, not a function with a return value).
  - `DoubleBinaryOperator` accepts two primitive `double` arguments and returns a primitive `double`.

---

### Question 13
Evaluate the following code snippet. What is printed?
```java
import java.util.stream.Stream;

public class StreamReduce {
    public static void main(String[] args) {
        int result = Stream.of(1, 2, 3)
                           .reduce(10, (accumulator, val) -> accumulator + val);
        System.out.println(result);
    }
}
```
- A. `6`
- B. `16`
- C. `26`
- D. Compilation fails because the identity parameter must match the stream type.

**Answer: B**
**Detailed Explanation:**
- **Stream.reduce:**
  - The `reduce(identity, accumulator)` method reduces stream elements using the accumulator, starting with the identity value `10`.
  - Steps:
    - Step 1: `10 + 1 = 11`
    - Step 2: `11 + 2 = 13`
    - Step 3: `13 + 3 = 16`
  - The final result is `16`.

---

### Question 14
What is the result of executing the following program?
```java
import java.util.*;
import java.util.stream.Collectors;

public class GroupingTest {
    public static void main(String[] args) {
        List<String> list = List.of("a", "b", "aa");
        Map<Integer, List<String>> map = list.stream().collect(
            Collectors.groupingBy(String::length)
        );
        System.out.println(map.get(1) + " | " + map.get(2));
    }
}
```
- A. `[a, b] | [aa]`
- B. `[a, aa] | [b]`
- C. `2 | 1`
- D. Throws ClassCastException at runtime.

**Answer: A**
**Detailed Explanation:**
- **Collectors.groupingBy:**
  - Groups elements according to the return value of the classification function (here, `String::length`).
  - By default, it collects elements into a `Map<K, List<T>>`.
  - `"a"` and `"b"` have length `1` -> grouped under key `1` -> `[a, b]`.
  - `"aa"` has length `2` -> grouped under key `2` -> `[aa]`.
  - The output is `[a, b] | [aa]`.

---

### Question 15
What is the behavior of the following code?
```java
import java.util.Optional;

public class FlatMapOptional {
    public static void main(String[] args) {
        Optional<String> opt = Optional.of("Outer");
        Optional<Optional<String>> nested = Optional.of(Optional.of("Inner"));
        
        System.out.print(opt.flatMap(s -> Optional.of("Mapped")).orElse("Empty") + " ");
        System.out.print(nested.flatMap(o -> o).orElse("Empty"));
    }
}
```
- A. `Mapped Inner`
- B. `Outer Inner`
- C. Compilation fails because `flatMap` is not defined for `Optional`.
- D. `Mapped Optional[Inner]`

**Answer: A**
**Detailed Explanation:**
- **Optional flatMap:**
  - Similar to streams, `flatMap` on an `Optional` unwraps nested Optionals. The mapper function must return an `Optional`.
  - `opt.flatMap(s -> Optional.of("Mapped"))` returns `Optional.of("Mapped")`, which resolves via `orElse` to `"Mapped"`.
  - `nested.flatMap(o -> o)` flattens the `Optional<Optional<String>>` to `Optional<String>` containing `"Inner"`, which resolves to `"Inner"`.

---

### Question 16
What is the result of compiling and running the following program?
```java
import java.util.stream.Stream;

public class InfiniteStreamLimit {
    public static void main(String[] args) {
        Stream.generate(() -> "A")
              .filter(s -> s.startsWith("B"))
              .limit(5)
              .forEach(System.out::print);
        System.out.println(" Done");
    }
}
```
- A. ` Done`
- B. `AAAAA Done`
- C. Runs infinitely without printing anything.
- D. Throws `OutOfMemoryError` immediately.

**Answer: C**
**Detailed Explanation:**
- **Limit Position in Infinite Streams:**
  - `Stream.generate(() -> "A")` generates an infinite stream of `"A"` strings.
  - The filter only passes strings starting with `"B"`. No elements match this filter.
  - `limit(5)` waits until **5 elements pass the filter** to terminate the stream.
  - Since no element ever passes the filter, the stream runs infinitely. The print statement `" Done"` is never reached.

---

### Question 17
Which of the following code snippets compiles successfully and correctly checks if a value is present inside an Optional? (Choose all that apply)
- A. `Optional.of("A").ifPresent(System.out::println);`
- B. `if (Optional.of("A").isPresent()) { System.out.println("OK"); }`
- C. `Optional.of("A").ifPresentOrElse(System.out::println, () -> System.out.println("Empty"));`
- D. `Optional.of("A").ifPresentOrElse(System.out::println);`

**Answer: A, B, C**
**Detailed Explanation:**
- **Optional Checker Methods:**
  - **Option A compiles:** `ifPresent(Consumer)` executes the consumer if a value is present.
  - **Option B compiles:** `isPresent()` returns a primitive `boolean`.
  - **Option C compiles (Java 9+):** `ifPresentOrElse(Consumer, Runnable)` takes two arguments: a consumer for success and a runnable if the optional is empty.
  - **Option D fails to compile:** `ifPresentOrElse` requires exactly two arguments, not one.

---

### Question 18
What does the following code print?
```java
import java.util.stream.Stream;

public class StreamSkipLimit {
    public static void main(String[] args) {
        Stream.of(1, 2, 3, 4, 5)
              .skip(2)
              .limit(2)
              .forEach(System.out::print);
    }
}
```
- A. `34`
- B. `12`
- C. `23`
- D. `45`

**Answer: A**
**Detailed Explanation:**
- **skip and limit execution:**
  - `skip(2)` skips the first two elements (`1` and `2`), leaving `3, 4, 5`.
  - `limit(2)` limits the stream to the next two elements, which are `3` and `4`.
  - The output is `34`.

---

### Question 19
What is the result of attempting to compile and run the following code?
```java
import java.util.function.Predicate;

public class PredicateCombine {
    public static void main(String[] args) {
        Predicate<String> p1 = s -> s.contains("A");
        Predicate<String> p2 = s -> s.length() > 2;
        
        Predicate<String> combined = p1.and(p2).negate();
        System.out.println(combined.test("ABC") + " " + combined.test("AB"));
    }
}
```
- A. `false true`
- B. `true false`
- C. `true true`
- D. Compilation fails because functional interfaces cannot be chained with default methods.

**Answer: A**
**Detailed Explanation:**
- **Predicate default methods:** Functional interfaces can contain default methods. `Predicate` contains `and()`, `or()`, and `negate()`.
- The logic of the combined predicate is `!(contains("A") && length() > 2)`.
- Testing `"ABC"`: contains `"A"` (true) and length is 3 (true). `true && true = true`. The negation returns `false`.
- Testing `"AB"`: contains `"A"` (true) and length is 2 (false). `true && false = false`. The negation returns `true`.
- The output is `false true`.

---

### Question 20
What is the result of compiling and running the following code segment under Java 21?
```java
import java.util.*;
import java.util.stream.Collectors;

public class TestCollector {
    public static void main(String[] args) {
        List<String> list = List.of("X", "Y");
        String result = list.stream().collect(Collectors.joining("-", "[", "]"));
        System.out.println(result);
    }
}
```
- A. `[X-Y]`
- B. `X-Y`
- C. `[X]-[Y]`
- D. Compilation fails because `joining` only takes a delimiter.

**Answer: A**
**Detailed Explanation:**
- **Collectors.joining Overloads:** The `joining` method has three overloads:
  - `joining()`: Joins strings directly.
  - `joining(CharSequence delimiter)`: Joins strings with a delimiter.
  - `joining(CharSequence delimiter, CharSequence prefix, CharSequence suffix)`: Joins strings with a delimiter and wraps the result with a prefix and suffix.
  - Here `joining("-", "[", "]")` is used. The delimiter is `"-"`, prefix is `"["`, and suffix is `"]"`.
  - The output is `[X-Y]`.
