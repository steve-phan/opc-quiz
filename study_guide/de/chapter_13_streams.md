# Kapitel 13: Funktionale Programmierung & Streams API

## 1. Core Java 21 Prüfungsziele
- Lambda-Ausdrücke schreiben und sie in integrierte funktionale Schnittstellen (Functional Interfaces) abbilden.
- Standardmäßige funktionale Schnittstellen beherrschen: `Predicate`, `Consumer`, `Supplier`, `Function`, `UnaryOperator` und `BinaryOperator`.
- Die Klasse `Optional` zur Absicherung der Null-Safety verwenden.
- Die Streams API verstehen: Pipeline-Erstellung, intermediäre (lazy) Operationen und terminale (eager) Operationen.
- Das Verhalten von parallelen Streams im Detail verstehen.

---

## 2. Detaillierte Konzepte

### Standardmäßige funktionale Schnittstellen
Ein funktionales Interface besitzt genau eine abstrakte Methode. Java 8 stellt das Paket `java.util.function` bereit, das 43 standardmäßige funktionale Schnittstellen enthält. Die wichtigsten Kern-Schnittstellen sind:

| Interface | Abstrakte Methode | Parameter | Rückgabetyp | Beispiel |
| :--- | :--- | :--- | :--- | :--- |
| **`Predicate<T>`** | `boolean test(T t)` | 1 ($T$) | `boolean` | Ist ein Buchpreis $> \$50$? |
| **`Consumer<T>`** | `void accept(T t)` | 1 ($T$) | `void` | Buchdetails ausgeben. |
| **`Supplier<T>`** | `T get()` | 0 | $T$ | Eine neue ArrayList instanziieren. |
| **`Function<T, R>`** | `R apply(T t)` | 1 ($T$) | $R$ | String-Titel aus Book extrahieren. |
| **`UnaryOperator<T>`** | `T apply(T t)` | 1 ($T$) | $T$ (gleicher Typ) | Einen Preis verdoppeln: $x \rightarrow x \times 2$. |
| **`BinaryOperator<T>`**| `T apply(T t1, T t2)`| 2 ($T, T$) | $T$ (gleicher Typ) | Zwei Ganzzahlen addieren. |

### Stream-Pipeline: Lazy vs. Eager
Eine Stream-Pipeline ist eine Sequenz von Datenverarbeitungsoperationen.
1. **Quelle (Source):** Eine Collection, ein Array oder ein Datei-Generator.
2. **Intermediäre Operationen (Lazy):** Transformieren den Stream in einen anderen Stream. Sie führen beim Aufruf **keine** Verarbeitung durch. Stattdessen zeichnen sie die Operation in einer Pipeline-Kette auf. Beispiele: `filter()`, `map()`, `sorted()`, `distinct()`, `limit()`.
3. **Terminale Operationen (Eager):** Führen die gesamte Pipeline aus und geben ein Ergebnis (oder void) zurück. Beispiele: `collect()`, `forEach()`, `count()`, `findFirst()`, `reduce()`.
- *OCP-Falle:* Wenn Sie einen Stream mit mehreren intermediären Operationen erstellen, aber keine terminale Operation aufrufen, werden **keine Elemente verarbeitet** und etwaige print-Anweisungen in Ihren Filtern werden nicht ausgeführt!

---

## 3. JVM-Interna & Speicherlayout

### Lambda-Kompilierung: `invokedynamic`
Vor Java 8 erforderte die Implementierung von Verhaltensübergaben anonyme innere Klassen, die zu separaten `.class`-Dateien kompiliert wurden, die JAR-Größe aufblähten und Constructor-Overhead auf dem Heap verursachten.
- Lambdas werden **nicht** in anonyme innere Klassen kompiliert.
- Stattdessen kompiliert der Java-Compiler den Lambda-Code in eine private synthetische Methode innerhalb derselben Klasse.
- Der Compiler fügt an der Aufrufstelle eine **`invokedynamic` (Indy)** Bytecode-Instruktion ein.
- Wenn die JVM zur Laufzeit `invokedynamic` ausführt, ruft sie eine Bootstrap-Methode (`LambdaMetafactory.metafactory`) auf, welche dynamisch eine Call Site erzeugt, die auf ein leichtgewichtiges funktionales Objekt zeigt, welches die synthetische Methode kapselt.
- Diese dynamische Erzeugung vermeidet die Generierung zusätzlicher `.class`-Dateien und reduziert den Speicher-Overhead erheblich.

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

## 4. Tricky OCP Exam Questions

### Frage 1
Was ist das Ergebnis des Versuchs, den folgenden Code zu kompilieren und auszuführen?
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
- A. Kompiliert erfolgreich und gibt `15` aus.
- B. Kompiliert erfolgreich und gibt `25` aus.
- C. Die Kompilierung schlägt fehl, da `x` modifiziert wird und nicht mehr effektiv final (effectively final) ist.
- D. Die Kompilierung schlägt fehl, da auf in `main` definierte Variablen nicht in einem Lambda zugegriffen werden kann.

**Antwort: C**
**Erklärung (German/English):**
- **Effectively Final Restriction:** Variablen, die aus einer Lambda-Expression heraus referenziert werden, müssen entweder explizit als `final` deklariert sein oder **effektiv final** (effectively final) sein.
- Eine Variable ist effektiv final, wenn ihr Wert nach der Initialisierung nie verändert wird.
- Da `x` nach der Lambda-Definition auf `20` geändert wird (`x = 20;`), verliert sie ihren Status als "effectively final". Der Compiler bricht den Kompilierungsvorgang an der Stelle des Lambda-Ausdrucks ab ("local variables referenced from a lambda expression must be final or effectively final").

---

### Frage 2
Welche der folgenden Lambda-Ausdrücke kompilieren erfolgreich? (Wählen Sie alle zutreffenden Antworten)
- A. `BiFunction<String, String, String> f1 = (var x, y) -> x + y;`
- B. `BiFunction<String, String, String> f2 = (var x, var y) -> x + y;`
- C. `BiFunction<String, String, String> f3 = (String x, var y) -> x + y;`
- D. `BiFunction<String, String, String> f4 = (x, y) -> x + y;`
- E. `BiFunction<String, String, String> f5 = x, y -> x + y;`

**Antwort: B, D**
**Erklärung (German/English):**
- **Lambda Parameter Rules:** Für die Deklaration von Lambda-Parametern gelten strenge Konsistenzregeln:
  - **Option A fails:** Es ist verboten, implizite (`y`) und mit `var` deklarierte (`var x`) Parameter zu mischen.
  - **Option B compiles:** Die Verwendung von `var` für alle Parameter ist erlaubt (Java 11+).
  - **Option C fails:** Es ist verboten, explizite Typen (`String x`) und `var` (`var y`) zu mischen.
  - **Option D compiles:** Die Auslassung aller Typen (vollständige Typinferenz) ist der Standard und vollkommen legal.
  - **Option E fails:** Klammern um die Parameter sind zwingend erforderlich, sobald mehr als ein Parameter deklariert wird (auch bei null Parametern).

---

### Frage 3
Was ist die Ausgabe des folgenden Programms?
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

**Antwort: C**
**Detaillierte Erklärung:**
- **Auswertung von orElse vs orElseGet:**
  - `orElse(T other)` wertet sein Argument (`getDefault()`) **eager (sofort)** aus, unabhängig davon, ob das `Optional` einen Wert enthält oder nicht. Da das `Optional` nicht leer ist (es enthält `"Present"`), wird `"Called "` ausgegeben, aber der Standardwert wird ignoriert.
  - `orElseGet(Supplier<? extends T> other)` wertet sein Argument **lazy (verzögert)** aus. Der Supplier wird nur ausgeführt, wenn das `Optional` leer ist. Da das `Optional` einen Wert enthält, wird der Supplier in Schritt 2 nicht aufgerufen.

---

### Frage 4
Was ist das Ergebnis der Ausführung des folgenden Codes?
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
- C. `123` gefolgt von einem Kompilierungsfehler.
- D. `ISE`

**Antwort: B**
**Detaillierte Erklärung:**
- **Lebenszyklus eines Streams:** Ein Java-Stream kann nur **ein einziges Mal** verwendet werden.
- Sobald eine terminale Operation (wie `forEach`) aufgerufen wird, gilt der Stream als konsumiert und geschlossen.
- Jeder nachfolgende Versuch, eine andere Operation (intermediär oder terminal, wie `count()`) auf demselben Stream-Objekt aufzurufen, führt zur Laufzeit zu einer `IllegalStateException` (was `ISE` ausgibt).

---

### Frage 5
Was gibt die folgende Stream-Pipeline bei der Ausführung aus?
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
- C. Läuft unendlich, ohne etwas auszugeben.
- D. `2 4` gefolgt von einer Endlosschleife.

**Antwort: A**
**Detaillierte Erklärung:**
- **Kurzschluss-Verhalten (Short-Circuiting):**
  - `Stream.iterate(1, i -> i + 1)` erzeugt einen unendlichen Stream von Integern: `1, 2, 3, 4, 5, ...`
  - Der Filter lässt nur gerade Zahlen durch.
  - `1` wird herausgefiltert.
  - `2` passiert den Filter, wird von `peek()` ausgegeben und von `anyMatch(i > 3)` als `false` ausgewertet.
  - `3` wird herausgefiltert.
  - `4` passiert den Filter, wird von `peek()` ausgegeben und von `anyMatch(i > 3)` als `true` ausgewertet.
  - Da `anyMatch` eine kurzschließende (short-circuiting) terminale Operation ist, stoppt die Auswertung sofort, sobald `true` ermittelt wird. Der unendliche Stream stoppt und das Programm gibt `2 4 true` aus.

---

### Frage 6
Was ist das Ergebnis des Versuchs, den folgenden Code zu kompilieren und auszuführen?
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
- C. Wirft zur Laufzeit eine `IllegalStateException`.
- D. Die Kompilierung schlägt fehl, da `average()` ein `OptionalDouble` zurückgibt, an das `orElse(double)` nicht angehängt werden kann.

**Antwort: C**
**Detaillierte Erklärung:**
- Wie in Frage 4 erklärt, kann ein primitiver Stream (`IntStream`) nicht wiederverwendet werden, sobald eine terminale Operation aufgerufen wurde.
- `stream.sum()` is eine terminale Operation und schließt den Stream.
- Der Aufruf von `stream.average()` danach wirft eine `IllegalStateException`. Um beide Operationen durchzuführen, müssen zwei separate Streams erstellt werden.

---

### Frage 7
Was ist das Ergebnis der Kompilierung und Ausführung dieses Codes?
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

**Antwort: C**
**Detaillierte Erklärung:**
- **Kollision bei Collectors.toMap:** Standardmäßig wirft `toMap(keyMapper, valueMapper)` zur Laufzeit eine `IllegalStateException`, wenn doppelte Schlüssel auftreten.
- Sowohl `"apple"` als auch `"apricot"` haben eine Länge von `5`, was zu einer Kollision für den Schlüssel `5` führt.
- Ohne die Angabe einer Merge-Funktion (z. B. `(s1, s2) -> s1`) wirft der Collector eine `IllegalStateException`.

---

### Frage 8
Was ist das Ergebnis der Ausführung des folgenden Programms?
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
- C. Die Kompilierung schlägt fehl, da `partitioningBy` immer eine `Map<Boolean, List<T>>` zurückgibt.
- D. Wirft zur Laufzeit eine `ClassCastException`.

**Antwort: A**
**Detaillierte Erklärung:**
- **partitioningBy mit Downstream-Collector:**
  - `partitioningBy(Predicate)` teilt die Elemente in eine `Map<Boolean, List<T>>` auf.
  - Wenn jedoch ein nachgeschalteter (downstream) Collector wie `Collectors.counting()` übergeben wird, werden die Listen durch das Ergebnis der Collection ersetzt. In diesem Fall zählt `counting()` die Elemente in jeder Partition.
  - `"BB"` und `"CCC"` erfüllen `length() > 1` -> `2` Elemente für `true`.
  - `"A"` erfüllt `length() > 1` nicht -> `1` Element für `false`.
  - Die Ausgabe ist `2 1`.

---

### Frage 9
Betrachten Sie die folgende Stream-Pipeline:
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
Welche der folgenden Aussagen über diese Ausführung ist wahr?
- A. Die Ausgabe erfolgt immer in der Reihenfolge `12345`.
- B. Die Reihenfolge der Ausgabe ist nicht deterministisch (z. B. `31524`).
- C. Der Code kompiliert nicht, da `forEachOrdered` nur für sequentielle Streams verfügbar ist.
- D. Die Ausgabe wird immer in absteigender Reihenfolge sortiert sein.

**Antwort: A**
**Detaillierte Erklärung:**
- **forEach vs. forEachOrdered:**
  - `forEach` führt Aktionen bei parallelen Streams nicht-deterministisch (ohne feste Reihenfolge) aus, um die Performance zu maximieren.
  - `forEachOrdered` garantiert, dass die Stream-Elemente in der ursprünglichen Reihenfolge der Quelle verarbeitet werden, selbst bei einem parallelen Stream.
  - Daher ist die Ausgabe garantiert der Reihe nach `12345`.

---

### Frage 10
Was gibt der folgende Code aus?
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

**Antwort: B**
**Detaillierte Erklärung:**
- **IntStream-Range-Methoden:**
  - `IntStream.range(start, end)` erzeugt einen sequentiellen Stream von `start` (inklusive) bis `end` (**exklusive**). `range(1, 5)` erzeugt `1, 2, 3, 4` (Größe 4).
  - `IntStream.rangeClosed(start, end)` erzeugt einen sequentiellen Stream von `start` (inklusive) bis `end` (**inklusive**). `rangeClosed(1, 5)` erzeugt `1, 2, 3, 4, 5` (Größe 5).

---

### Frage 11
Was ist das Ergebnis des Versuchs, den folgenden Code zu kompilieren?
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
- A. Kompiliert und gibt `AB` aus.
- B. Die Kompilierung schlägt fehl, da `flatMap` ein `Stream`-Objekt zurückgeben muss und keinen String.
- C. Die Kompilierung schlägt fehl, da `flatMap` für `Stream<List<String>>` nicht definiert ist.
- D. Wirft zur Laufzeit eine `ClassCastException`.

**Antwort: B**
**Detaillierte Erklärung:**
- **Rückgabetyp-Anforderung von flatMap:** Die an `flatMap` übergebene Mapper-Funktion must ein **`Stream`**-Objekt zurückgeben (z. B. `subList.stream()`) und kein einzelnes Element.
- Da `subList.get(0)` einen `String` zurückgibt, kompilierte der Code nicht.

---

### Frage 12
Welche der folgenden funktionalen Schnittstellen aus `java.util.function` akzeptieren zwei Argumente und geben einen primitiven Wert zurück? (Wählen Sie alle zutreffenden Antworten)
- A. `BiFunction<T, U, Integer>`
- B. `ToIntBiFunction<T, U>`
- C. `ObjIntConsumer<T>`
- D. `DoubleBinaryOperator`

**Antwort: B, D**
**Detaillierte Erklärung:**
- **Primitive funktionale Schnittstellen (Functional Interfaces):**
  - `BiFunction<T, U, Integer>` akzeptiert zwei Objekte und gibt ein geboxtes `Integer`-Objekt zurück, keinen primitiven Wert.
  - `ToIntBiFunction<T, U>` hat die abstrakte Methode `applyAsInt(T, U)`, die ein primitives `int` zurückgibt.
  - `ObjIntConsumer<T>` akzeptiert zwei Argumente (ein Objekt und ein primitives `int`) und gibt `void` zurück (ein Consumer, keine Funktion mit einem Rückgabewert).
  - `DoubleBinaryOperator` akzeptiert zwei primitive `double`-Argumente und gibt ein primitives `double` zurück.

---

### Frage 13
Werten Sie den folgenden Codeschnipsel aus. Was wird ausgegeben?
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
- D. Die Kompilierung schlägt fehl, da der Identity-Parameter mit dem Stream-Typ übereinstimmen muss.

**Antwort: B**
**Detaillierte Erklärung:**
- **Stream.reduce:**
  - Die Methode `reduce(identity, accumulator)` reduziert Stream-Elemente mithilfe des Accumulators und startet mit dem Identity-Wert `10`.
  - Schritte:
    - Schritt 1: `10 + 1 = 11`
    - Schritt 2: `11 + 2 = 13`
    - Schritt 3: `13 + 3 = 16`
  - Das Endergebnis ist `16`.

---

### Frage 14
Was ist das Ergebnis der Ausführung des folgenden Programms?
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
- D. Wirft zur Laufzeit eine `ClassCastException`.

**Antwort: A**
**Detaillierte Erklärung:**
- **Collectors.groupingBy:**
  - Gruppiert Elemente nach dem Rückgabewert der Klassifizierungsfunktion (hier `String::length`).
  - Standardmäßig sammelt es Elemente in eine `Map<K, List<T>>`.
  - `"a"` und `"b"` haben die Länge `1` -> gruppiert unter dem Schlüssel `1` -> `[a, b]`.
  - `"aa"` hat die Länge `2` -> gruppiert unter dem Schlüssel `2` -> `[aa]`.
  - Die Ausgabe ist `[a, b] | [aa]`.

---

### Frage 15
Wie verhält sich der folgende Code?
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
- C. Die Kompilierung schlägt fehl, da `flatMap` nicht für `Optional` definiert ist.
- D. `Mapped Optional[Inner]`

**Antwort: A**
**Detaillierte Erklärung:**
- **Optional.flatMap:**
  - Ähnlich wie bei Streams entpackt `flatMap` bei einem `Optional` verschachtelte Optionals. Die Mapper-Funktion muss ein `Optional` zurückgeben.
  - `opt.flatMap(s -> Optional.of("Mapped"))` gibt `Optional.of("Mapped")` zurück, was über `orElse` zu `"Mapped"` aufgelöst wird.
  - `nested.flatMap(o -> o)` flacht das `Optional<Optional<String>>` zu einem `Optional<String>` ab, das `"Inner"` enthält, welches zu `"Inner"` aufgelöst wird.

---

### Frage 16
Was ist das Ergebnis der Kompilierung und Ausführung des folgenden Programms?
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
- C. Läuft unendlich, ohne etwas auszugeben.
- D. Wirft sofort einen `OutOfMemoryError`.

**Antwort: C**
**Detaillierte Erklärung:**
- **Position von limit in unendlichen Streams:**
  - `Stream.generate(() -> "A")` erzeugt einen unendlichen Stream von `"A"`-Strings.
  - Der Filter lässt nur Strings durch, die mit `"B"` beginnen. Kein Element erfüllt diesen Filter.
  - `limit(5)` wartet, bis **5 Elemente den Filter passieren**, um den Stream zu beenden.
  - Da nie ein Element den Filter passiert, läuft der Stream unendlich. Die Ausgabeanweisung `" Done"` wird nie erreicht.

---

### Frage 17
Welche der folgenden Codeschnipsel kompilieren erfolgreich und prüfen korrekt, ob ein Wert in einem Optional vorhanden ist? (Wählen Sie alle zutreffenden Antworten)
- A. `Optional.of("A").ifPresent(System.out::println);`
- B. `if (Optional.of("A").isPresent()) { System.out.println("OK"); }`
- C. `Optional.of("A").ifPresentOrElse(System.out::println, () -> System.out.println("Empty"));`
- D. `Optional.of("A").ifPresentOrElse(System.out::println);`

**Antwort: A, B, C**
**Detaillierte Erklärung:**
- **Optional-Prüfmethoden:**
  - **Option A kompiliert:** `ifPresent(Consumer)` führt den Consumer aus, wenn ein Wert vorhanden ist.
  - **Option B kompiliert:** `isPresent()` gibt ein primitives `boolean` zurück.
  - **Option C kompiliert (Java 9+):** `ifPresentOrElse(Consumer, Runnable)` nimmt zwei Argumente entgegen: einen Consumer für den Erfolgsfall und ein Runnable, falls das Optional leer ist.
  - **Option D kompiliert nicht:** `ifPresentOrElse` erfordert genau zwei Argumente, nicht eines.

---

### Frage 18
Was gibt der folgende Code aus?
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

**Antwort: A**
**Detaillierte Erklärung:**
- **Ausführung von skip und limit:**
  - `skip(2)` überspringt die ersten beiden Elemente (`1` und `2`), sodass `3, 4, 5` übrig bleiben.
  - `limit(2)` begrenzt den Stream auf die nächsten beiden Elemente, welche `3` und `4` sind.
  - Die Ausgabe ist `34`.

---

### Frage 19
Was ist das Ergebnis des Versuchs, den folgenden Code zu kompilieren und auszuführen?
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
- D. Die Kompilierung schlägt fehl, da funktionale Schnittstellen nicht mit Default-Methoden verkettet werden können.

**Antwort: A**
**Detaillierte Erklärung:**
- **Default-Methoden in Predicate:** Funktionale Schnittstellen können Default-Methoden enthalten. `Predicate` enthält `and()`, `or()` und `negate()`.
- Die Logik des kombinierten Predicates ist `!(contains("A") && length() > 2)`.
- Testen von `"ABC"`: enthält `"A"` (true) und die Länge ist 3 (true). `true && true = true`. Die Negation gibt `false` zurück.
- Testen von `"AB"`: enthält `"A"` (true) und die Länge ist 2 (false). `true && false = false`. Die Negation gibt `true` zurück.
- Die Ausgabe ist `false true`.

---

### Frage 20
Was ist das Ergebnis der Kompilierung und Ausführung des folgenden Codesegments unter Java 21?
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
- D. Die Kompilierung schlägt fehl, da `joining` nur ein Trennzeichen (Delimiter) akzeptiert.

**Antwort: A**
**Detaillierte Erklärung:**
- **Collectors.joining-Überladungen:** Die Methode `joining` hat drei Überladungen:
  - `joining()`: Verbindet Strings direkt miteinander.
  - `joining(CharSequence delimiter)`: Verbindet Strings mit einem Trennzeichen.
  - `joining(CharSequence delimiter, CharSequence prefix, CharSequence suffix)`: Verbindet Strings mit einem Trennzeichen und umschließt das Ergebnis mit einem Präfix und Suffix.
  - Hier wird `joining("-", "[", "]")` verwendet. Das Trennzeichen ist `"-"`, das Präfix `"["` und das Suffix `"]"`.
  - Die Ausgabe ist `[X-Y]`.
