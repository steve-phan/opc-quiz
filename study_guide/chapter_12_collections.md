# Chapter 12: Collections Framework & Sequenced Collections

## 1. Core Java 21 Exam Objectives
- Master the Collections framework interfaces: `List`, `Set`, `Map`, and `Queue`.
- Master Java 21 **Sequenced Collections** (interfaces, operations, and encounter order).
- Compare different collection implementations (e.g. `ArrayList` vs. `LinkedList`, `HashSet` vs. `TreeSet`).
- Implement custom sorting using `Comparable` and `Comparator` interfaces.

---

## 2. Deep-Dive Concepts

### Java 21 Sequenced Collections
One of the most important updates in Java 21 is the introduction of **Sequenced Collections**. Previously, accessing the first and last elements in a collection was inconsistent. For example, `list.get(0)` for a `List`, but you had to use an iterator for a `LinkedHashSet`.

Java 21 introduces three new interfaces to represent collections with a well-defined encounter order:
1. **`SequencedCollection<E>`:** Extends `Collection<E>`. Adds unified methods:
   - `void addFirst(E)` / `void addLast(E)`
   - `E getFirst()` / `E getLast()`
   - `E removeFirst()` / `E removeLast()`
   - `SequencedCollection<E> reversed()` (Returns a reversed-order view of the collection *without* copying elements).
2. **`SequencedSet<E>`:** Extends `SequencedCollection<E>` and `Set<E>`. Implemented by `LinkedHashSet` and `TreeSet`.
3. **`SequencedMap<K, V>`:** Extends `Map<K, V>`. Implemented by `LinkedHashMap` and `TreeMap`. Adds methods like `firstEntry()`, `lastEntry()`, `pollFirstEntry()`, `pollLastEntry()`, and `sequencedKeySet()`.

```
                    Collection
                        |
               SequencedCollection
             /          |          \
           List    SequencedSet    Queue
                        |
                   NavigableSet
```

### Collection Comparisons & Under-the-Hood Details
- **`ArrayList`:** Backed by a resizeable array. Fast random access ($O(1)$), slow insertion/deletion in the middle ($O(N)$) due to array shifting.
- **`HashSet`:** Under the hood, it is backed by a **`HashMap`**. When you add an element to a `HashSet`, Java puts it in the backing `HashMap` as a key, with a dummy static object constant (`new Object()`) as the value. This is why sets have no duplicates and $O(1)$ lookup times.
- **`TreeSet`:** Backed by a Red-Black Tree. Elements are sorted automatically. Elements must implement `Comparable`, or a custom `Comparator` must be supplied.

---

## 3. JVM Internals & Memory Layout

### Memory Efficiency of `reversed()`
A key OCP exam detail is how the `.reversed()` method behaves:
- When you invoke `list.reversed()`, the JVM does **not** allocate a new collection or copy the pointers to a new array (which would be $O(N)$ memory and time overhead).
- Instead, it returns a lightweight **reversed-order view** wrapper pointing to the original collection.
- Operations on the reversed view reflect directly on the original collection. If you write `list.reversed().addFirst("x")`, `"x"` is added to the *last* position of the original list.

---

## 4. Tricky OCP Exam Questions

### Question 1
What is the result of executing the following Java 21 code segment?
```java
import java.util.*;

public class Test {
    public static void main(String[] args) {
        SequencedSet<Integer> set = new TreeSet<>(List.of(2, 1, 3));
        try {
            set.addFirst(0);
            System.out.println("Success: " + set);
        } catch (Exception e) {
            System.out.println(e.getClass().getSimpleName());
        }
    }
}
```
- A. `Success: [0, 1, 2, 3]`
- B. `Success: [0, 2, 1, 3]`
- C. `UnsupportedOperationException`
- D. `ClassCastException`

**Answer: C**
**Explanation (German/English):**
- **TreeSet with SequencedCollection operations:** `TreeSet` implementiert `NavigableSet`, welches wiederum `SequencedSet` erweitert. Daher kompiliert der Aufruf `set.addFirst(0)` ohne Probleme.
- Zur Laufzeit wirft ein sortiertes Set (`TreeSet`) jedoch eine `UnsupportedOperationException` bei Aufrufen von `addFirst(E)` und `addLast(E)`.
- **Grund:** Die Position der Elemente in einem `TreeSet` wird ausschließlich durch deren natürlichen Vergleich (`Comparable`) oder den übergebenen `Comparator` bestimmt. Ein manuelles Positionieren am Anfang oder Ende des Sets ist nicht zulässig.

---

### Question 2
What is the output of the following program?
```java
import java.util.*;

public class MergeTest {
    public static void main(String[] args) {
        Map<String, String> map = new HashMap<>();
        map.put("A", "Apple");
        map.put("B", null);

        map.merge("A", "Apricot", (oldVal, newVal) -> null);
        map.merge("B", "Banana", (oldVal, newVal) -> "Berry");
        map.merge("C", "Cherry", (oldVal, newVal) -> "Cranberry");

        System.out.println(map.size() + " " + map.get("A") + " " + map.get("B") + " " + map.get("C"));
    }
}
```
- A. `3 Apricot Banana Cherry`
- B. `2 null Banana Cherry`
- C. `2 null Berry Cherry`
- D. `3 null Banana Cranberry`

**Answer: B**
**Explanation (German/English):**
- **Map.merge Rules:** Die Methode `merge(key, value, BiFunction)` arbeitet nach folgenden Regeln:
  - Wenn der Key `"A"` vorhanden ist und einen Nicht-Null-Wert hat (`"Apple"`), wird die `BiFunction` aufgerufen. Da diese `null` zurückgibt, wird der Key `"A"` komplett aus der Map **entfernt**.
  - Wenn der Key `"B"` vorhanden ist, aber der Wert `null` ist (oder der Key fehlt), wird der übergebene Wert (`"Banana"`) direkt eingetragen. Die `BiFunction` wird **nicht** aufgerufen.
  - Wenn der Key `"C"` nicht in der Map existiert, wird der Wert (`"Cherry"`) direkt assoziiert. Die `BiFunction` wird ebenfalls **nicht** aufgerufen.
  - Am Ende hat die Map die Größe 2 und enthält `{B=Banana, C=Cherry}`.

---

### Question 3
Consider the following statements about Java Collection instantiation. Which of the lines will throw an exception at runtime? (Choose all that apply)
- A. `List<String> list1 = List.of("A", null);`
- B. `List<String> list2 = Arrays.asList("A", null);`
- C. `List<String> list3 = Arrays.asList("A", "B"); list3.set(0, "C");`
- D. `List<String> list4 = Arrays.asList("A", "B"); list4.add("C");`
- E. `List<String> list5 = List.of("A", "B"); list5.set(0, "C");`

**Answer: A, D, E**
**Explanation (German/English):**
- **Option A throws NullPointerException:** Die Factory-Methoden `List.of()`, `Set.of()` und `Map.of()` erlauben keinerlei `null`-Werte (weder als Keys noch als Values).
- **Option B runs successfully:** `Arrays.asList()` erlaubt `null`-Elemente.
- **Option C runs successfully:** `Arrays.asList()` liefert eine Liste mit fester Größe, die direkt auf dem darunterliegenden Array operiert. Werte können mit `set()` überschrieben werden.
- **Option D throws UnsupportedOperationException:** Da die Liste von `Arrays.asList()` eine feste Größe hat, sind strukturelle Änderungen (wie `add()` oder `remove()`) verboten.
- **Option E throws UnsupportedOperationException:** `List.of()` liefert eine vollständig unmodifizierbare Liste. Weder `add()` noch `set()` sind erlaubt.

---

### Question 4
What is the output of the following program?
```java
import java.util.*;

public class ComputeTest {
    public static void main(String[] args) {
        Map<Integer, Integer> map = new HashMap<>();
        map.put(1, 10);
        map.computeIfAbsent(1, k -> k * 2);
        map.computeIfAbsent(2, k -> k * 2);
        map.computeIfPresent(2, (k, v) -> k + v);
        System.out.println(map);
    }
}
```
- A. `{1=10, 2=4}`
- B. `{1=2, 2=6}`
- C. `{1=10, 2=6}`
- D. `{1=2, 2=4}`

**Answer: C**
**Explanation (German/English):**
- **Map.computeIfAbsent:**
  - Für Key `1` ist bereits ein Wert vorhanden (`10`). Die Funktion wird nicht ausgeführt.
  - Für Key `2` fehlt der Wert. Die Funktion berechnet `k * 2` (wobei `k` der Key `2` ist) = `4`. Der Eintrag `{2=4}` wird hinzugefügt.
- **Map.computeIfPresent:**
  - Für Key `2` ist der Wert vorhanden (`4`). Die `BiFunction` berechnet `k + v` (wobei `k` der Key `2` und `v` der aktuelle Wert `4` ist) = `6`. Der Wert wird auf `6` aktualisiert.
  - Am Ende enthält die Map `{1=10, 2=6}`.

---

### Question 5
Which of the following classes in the `java.util` package do NOT implement the `SequencedCollection` interface under Java 21? (Choose all that apply)
- A. `ArrayList`
- B. `LinkedList`
- C. `ArrayDeque`
- D. `PriorityQueue`
- E. `HashSet`

**Answer: D, E**
**Explanation (German/English):**
- **Encounter Order Requirement:** Das Interface `SequencedCollection` setzt voraus, dass eine Kollektion eine wohldefinierte Reihenfolge der Elemente (Encounter Order) besitzt.
- **PriorityQueue (D):** Garantiert zwar, dass das kleinste Element am Kopf der Warteschlange steht, hat aber keine feste Reihenfolge für die restlichen Elemente (der Iterator liefert sie in unsortierter Reihenfolge). Daher implementiert `PriorityQueue` **nicht** `SequencedCollection`.
- **HashSet (E):** Ist ein ungeordnetes Set ohne feste Reihenfolge und implementiert `SequencedCollection` ebenfalls nicht. (Achtung: `LinkedHashSet` implementiert es hingegen schon, da es die Einfügereihenfolge beibehält).

---

### Question 6
What is the result of running the following code segment under Java 21?
```java
List<String> list = new ArrayList<>(List.of("A", "B", "C"));
List<String> rev = list.reversed();
rev.set(1, "X");
list.add("D");
System.out.println(list + " | " + rev);
```
- A. `[A, B, C, D] | [C, B, A]`
- B. `[A, X, C, D] | [D, C, X, A]`
- C. `[A, X, C, D] | [C, X, A, D]`
- D. `[A, X, C, D] | [D, C, X, A]` (after throwing Exception)
- E. `[A, X, C, D] | [D, C, X, A]` is incorrect; it is actually `[A, X, C, D] | [D, C, X, A]` because of runtime synchronization issues.
- F. `[A, X, C, D] | [D, C, X, A]` is incorrect. The code prints: `[A, X, C, D] | [D, C, X, A]` but actually it prints `[A, X, C, D] | [D, C, X, A]`? Let's check.

**Answer: B** (or rather, the actual printed values are `[A, X, C, D] | [D, C, X, A]`)
**Explanation (German/English):**
- **Reversed view behavior:** `list.reversed()` erzeugt ein leichtgewichtiges Wrapper-Objekt (View), welches direkt auf die ursprüngliche Liste verweist.
- Modifikationen an der View schreiben direkt auf die Original-Liste durch. `rev.set(1, "X")` ersetzt das Element an Index 1 der umgedrehten Sicht (was Index 1 der Original-Liste entspricht). Die Original-Liste wird somit zu `[A, X, C]`.
- Modifikationen an der Original-Liste (`list.add("D")`) spiegeln sich sofort in der View wider. Die Original-Liste wird zu `[A, X, C, D]`, und die View spiegelt dies in umgekehrter Reihenfolge wider: `[D, C, X, A]`.

---

### Question 7
What is the output of compiling and running the following program?
```java
import java.util.*;

public class CollectionNullTest {
    public static void main(String[] args) {
        Collection<String> c1 = new LinkedList<>();
        Collection<String> c2 = new ArrayDeque<>();
        Collection<String> c3 = new TreeSet<>();
        
        try { c1.add(null); System.out.print("C1 "); } catch(Exception e) { System.out.print("E1 "); }
        try { c2.add(null); System.out.print("C2 "); } catch(Exception e) { System.out.print("E2 "); }
        try { c3.add(null); System.out.print("C3 "); } catch(Exception e) { System.out.print("E3 "); }
    }
}
```
- A. `C1 C2 C3`
- B. `C1 E2 E3`
- C. `E1 E2 E3`
- D. `C1 C2 E3`

**Answer: B**
**Explanation (German/English):**
- **Null elements in Collections:**
  - `LinkedList` (c1) erlaubt uneingeschränkt `null`-Elemente. Daher wird `C1` ausgegeben.
  - `ArrayDeque` (c2) verbietet `null`-Elemente strikt. Ein Aufruf von `add(null)` wirft sofort eine `NullPointerException`. Daher wird `E2` ausgegeben.
  - `TreeSet` (c3) sortiert seine Elemente. Da `null` nicht mit anderen Objekten verglichen werden kann, wirft `TreeSet` beim Einfügen von `null` eine `NullPointerException` (Ausnahme: Wenn ein spezieller Comparator übergeben wurde, der mit Null-Werten umgehen kann, was hier jedoch nicht der Fall ist). Daher wird `E3` ausgegeben.

---

### Question 8
Consider the following program:
```java
import java.util.*;

public class MapIteration {
    public static void main(String[] args) {
        Map<String, Integer> map = new LinkedHashMap<>();
        map.put("One", 1);
        map.put("Two", 2);
        map.put("Three", 3);
        
        for (var entry : map.entrySet()) {
            if (entry.getKey().equals("Two")) {
                map.put("Four", 4);
            }
        }
    }
}
```
What is the result of executing this code?
- A. Compiles and runs successfully without output.
- B. Throws `ConcurrentModificationException` at runtime.
- C. Throws `UnsupportedOperationException` at runtime.
- D. Compilation fails because `var` cannot be used in enhanced for-loops.

**Answer: B**
**Explanation (German/English):**
- **Concurrent Modification of Maps:** Wenn eine Map über ihr `entrySet()`, `keySet()` oder `values()` iteriert wird, führt jede strukturelle Änderung der Map (wie `put()` für einen neuen Schlüssel oder `remove()`) während der Iteration zu einer `ConcurrentModificationException`.
- Das Ändern eines existierenden Werts für einen bereits vorhandenen Key ist erlaubt, das Hinzufügen eines neuen Keys (`"Four"`) hingegen ist eine strukturelle Änderung und wirft die Exception.

---

### Question 9
What is the result of running the following code segment under Java 21?
```java
SequencedMap<String, String> map = new LinkedHashMap<>();
map.put("A", "Alpha");
map.put("B", "Beta");
map.put("A", "Apple");
System.out.println(map.sequencedKeySet());
```
- A. `[B, A]`
- B. `[A, B]`
- C. `[A, B, A]`
- D. Throws `UnsupportedOperationException` at runtime.

**Answer: B**
**Explanation (German/English):**
- **LinkedHashMap Encounter Order:** `LinkedHashMap` speichert die Elemente in der Reihenfolge ihrer ersten Einfügung (Insertion Order).
- Das erneute Einfügen eines bereits existierenden Keys (`map.put("A", "Apple")`) überschreibt zwar den Wert des Schlüssels, verändert jedoch standardmäßig seine Position in der Einfügereihenfolge **nicht**.
- Daher bleibt `"A"` an der ersten Stelle stehen. Die Ausgabe lautet `[A, B]`.

---

### Question 10
What is the outcome of compiling and running the following class?
```java
import java.util.*;

public class ComparableTest {
    static class Item implements Comparable<Item> {
        int id;
        Item(int id) { this.id = id; }
        public int compareTo(Item other) {
            return this.id - other.id;
        }
        public String toString() { return String.valueOf(id); }
    }
    
    public static void main(String[] args) {
        List<Item> list = new ArrayList<>(List.of(new Item(2), new Item(1)));
        Collections.sort(list, Comparator.reverseOrder());
        System.out.println(list);
    }
}
```
- A. `[1, 2]`
- B. `[2, 1]`
- C. Compilation fails because `Collections.sort` only accepts a list of elements that implement Comparable.
- D. Throws ClassCastException at runtime.

**Answer: B**
**Explanation (German/English):**
- **Comparator.reverseOrder():** 
  - Die Klasse `Item` implementiert `Comparable<Item>` korrekt (natürliche Sortierung aufsteigend nach `id`).
  - Der Aufruf `Collections.sort(list, Comparator.reverseOrder())` verwendet einen Comparator, der die natürliche Ordnung umkehrt.
  - Das Array wird somit absteigend sortiert, was zu `[2, 1]` führt. Der Code ist absolut gültig und kompiliert fehlerfrei.

---

### Question 11
What is the output of the following program?
```java
import java.util.*;

public class UnmodifiableTest {
    public static void main(String[] args) {
        List<String> original = new ArrayList<>();
        original.add("A");
        List<String> unmodifiable = Collections.unmodifiableList(original);
        original.add("B");
        try {
            unmodifiable.add("C");
        } catch (UnsupportedOperationException e) {
            System.out.print("UOE ");
        }
        System.out.print(unmodifiable.size());
    }
}
```
- A. `UOE 1`
- B. `UOE 2`
- C. `2`
- D. `1`

**Answer: B**
**Explanation (German/English):**
- **Wrapper vs copy in Collections:**
  - `Collections.unmodifiableList()` erzeugt ein **Wrapper-View-Objekt** um die Original-Liste, keine Kopie.
  - Modifikationen auf der unmodifizierbaren Referenz (`unmodifiable.add("C")`) sind verboten und werfen eine `UnsupportedOperationException` (Ausgabe `UOE`).
  - Änderungen an der Original-Liste (`original.add("B")`) werden jedoch direkt an die zugrundeliegende Liste geschrieben und sind über die unmodifizierbare View sichtbar. Daher wächst die Größe auf 2.

---

### Question 12
Given the following code block:
```java
import java.util.*;

public class SubListTest {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(List.of("A", "B", "C", "D"));
        List<String> sub = list.subList(1, 3);
        sub.set(0, "X");
        list.remove("D");
        try {
            System.out.println(sub.size());
        } catch (ConcurrentModificationException e) {
            System.out.println("CME");
        }
    }
}
```
What is the output of this code?
- A. `2`
- B. `CME`
- C. `3`
- D. `1`

**Answer: B**
**Explanation (German/English):**
- **subList View invalidation:**
  - `list.subList(1, 3)` liefert eine View auf einen Teilbereich der Originalliste (Elemente `"B"`, `"C"`).
  - Änderungen über die Subliste (`sub.set(0, "X")`) spiegeln sich in der Originalliste wider.
  - Wenn jedoch die **Originalliste strukturell verändert** wird (z. B. durch `list.remove("D")`), während die Subliste noch aktiv ist, wird die Subliste sofort ungültig (ihre internen Zähler stimmen nicht mehr mit der Originalliste überein).
  - Jeder nachfolgende Lese- oder Schreibzugriff auf die Subliste (`sub.size()`) wirft daraufhin eine `ConcurrentModificationException` (`CME`).

---

### Question 13
What is the result of attempting to compile and run the following code?
```java
import java.util.*;

public class MapNullTest {
    public static void main(String[] args) {
        Map<String, String> map1 = new TreeMap<>();
        Map<String, String> map2 = new Hashtable<>();
        
        try { map1.put(null, "Test"); } catch(Exception e) { System.out.print("E1 "); }
        try { map2.put("Key", null); } catch(Exception e) { System.out.print("E2"); }
    }
}
```
- A. Compiles successfully and prints `E1 E2`.
- B. Compilation fails.
- C. Prints only `E1`.
- D. Prints only `E2`.

**Answer: A**
**Explanation (German/English):**
- **Null values in Map implementations:**
  - `TreeMap` (map1) sortiert Schlüssel anhand ihrer natürlichen Ordnung. Da `null` nicht verglichen werden kann, wirft `TreeMap` beim Einfügen eines `null`-Keys eine `NullPointerException` (Ausgabe `E1`).
  - `Hashtable` (map2) erlaubt generell **weder null-Keys noch null-Values**. Ein Versuch, ein `null`-Value einzufügen, wirft eine `NullPointerException` (Ausgabe `E2`).
  - (Hinweis: `HashMap` erlaubt einen `null`-Key und beliebig viele `null`-Values).

---

### Question 14
Consider the following program:
```java
import java.util.*;

public class HashCodeCheck {
    static class Key {
        int val;
        Key(int val) { this.val = val; }
        public int hashCode() { return val % 2; }
        public boolean equals(Object o) {
            return (o instanceof Key other) && this.val == other.val;
        }
    }
    
    public static void main(String[] args) {
        Map<Key, String> map = new HashMap<>();
        Key k1 = new Key(1);
        Key k2 = new Key(3);
        map.put(k1, "First");
        map.put(k2, "Second");
        System.out.println(map.size() + " " + map.get(k1));
    }
}
```
What is the result of executing this code?
- A. `1 Second`
- B. `2 First`
- C. `2 Second`
- D. `1 First`

**Answer: B**
**Explanation (German/English):**
- **HashMap Collision Handling:**
  - `k1` und `k2` besitzen denselben Hashcode (`1 % 2 = 1` und `3 % 2 = 1`). Sie fallen somit in denselben Bucket der `HashMap` (Kollision).
  - Der `equals()`-Vergleich zwischen `k1` (val=1) und `k2` (val=3) liefert jedoch `false`.
  - Da sie nicht gleich (`equals`) sind, werden sie als zwei separate Einträge im selben Bucket der Map gespeichert. Die Größe der Map beträgt somit `2`.
  - `map.get(k1)` sucht nach einem Key, der gleich `k1` ist, findet den ersten Eintrag und gibt `"First"` zurück.

---

### Question 15
What is the result of compiling and running the following program?
```java
import java.util.*;

public class NavigableSetTest {
    public static void main(String[] args) {
        NavigableSet<Integer> set = new TreeSet<>(List.of(10, 20, 30, 40));
        System.out.print(set.lower(20) + " " + set.floor(20) + " " 
                         + set.ceiling(20) + " " + set.higher(20));
    }
}
```
- A. `10 20 20 30`
- B. `10 10 30 30`
- C. `20 20 20 20`
- D. `10 20 30 40`

**Answer: A**
**Explanation (German/English):**
- **NavigableSet boundary methods:**
  - `lower(E)`: Sucht das größte Element, das strikt kleiner als `E` ist (`lower(20)` -> `10`).
  - `floor(E)`: Sucht das größte Element, das kleiner oder gleich `E` ist (`floor(20)` -> `20`).
  - `ceiling(E)`: Sucht das kleinste Element, das größer oder gleich `E` ist (`ceiling(20)` -> `20`).
  - `higher(E)`: Sucht das kleinste Element, das strikt größer als `E` ist (`higher(20)` -> `30`).
  - Die Ausgabe lautet folglich `10 20 20 30`.

---

### Question 16
What does the following code print?
```java
import java.util.*;

public class ListRemove {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
        list.remove(1);
        System.out.println(list);
    }
}
```
- A. `[1, 3]`
- B. `[2, 3]`
- C. `[1, 2]`
- D. Throws a ClassCastException at runtime.

**Answer: A**
**Explanation (German/English):**
- **List.remove Overloads:** Das `List`-Interface besitzt zwei überladene `remove`-Methoden:
  - `remove(int index)`: Entfernt das Element an einem bestimmten Index.
  - `remove(Object o)`: Entfernt das erste Vorkommen eines bestimmten Objekts.
- Wenn ein primitives `int` (`1`) übergeben wird, wählt der Compiler die Methode `remove(int index)`. Es wird also das Element an Index 1 (Wert `2`) gelöscht. Das verbleibende Ergebnis ist `[1, 3]`.
- Um das Objekt mit dem Wert `1` zu entfernen, müsste man explizit `list.remove(Integer.valueOf(1))` aufrufen.

---

### Question 17
Given the following comparator definition, what is the output of sorting the list `["A", null, "B"]`?
```java
import java.util.*;

public class SortNulls {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("A");
        list.add(null);
        list.add("B");
        
        Comparator<String> comp = Comparator.nullsFirst(Comparator.naturalOrder());
        list.sort(comp);
        System.out.println(list);
    }
}
```
- A. `[A, B, null]`
- B. `[null, A, B]`
- C. Throws `NullPointerException` at runtime.
- D. `[null, B, A]`

**Answer: B**
**Explanation (German/English):**
- **Sorting Nulls:** Standard-Comparatoren werfen beim Vergleichen von `null` eine `NullPointerException`.
- `Comparator.nullsFirst(...)` erzeugt einen null-sicheren Comparator, der alle `null`-Werte an den Anfang der sortierten Reihenfolge einsortiert.
- Der Rest der Liste wird nach der übergebenen Reihenfolge (`naturalOrder()`, also alphabetisch) sortiert.
- Das Ergebnis ist somit `[null, A, B]`.

---

### Question 18
What is the output of compiling and running the following code?
```java
import java.util.*;

public class DequeStack {
    public static void main(String[] args) {
        Deque<String> stack = new ArrayDeque<>();
        stack.push("A");
        stack.push("B");
        stack.offer("C");
        System.out.print(stack.pop() + " " + stack.poll());
    }
}
```
- A. `B A`
- B. `B C`
- C. `A B`
- D. `C B`

**Answer: A**
**Explanation (German/English):**
- **Deque double-ended operations:**
  - `stack.push("A")` fügt `"A"` am Kopf (Front) der Deque hinzu (`[A]`).
  - `stack.push("B")` fügt `"B"` ebenfalls am Kopf hinzu (`[B, A]`).
  - `stack.offer("C")` fügt `"C"` am Ende (Tail) der Deque hinzu (Warteschlangen-Verhalten) (`[B, A, C]`).
  - `stack.pop()` entfernt und liefert das Element am Kopf der Deque (`"B"`, verbleibend `[A, C]`).
  - `stack.poll()` entfernt und liefert ebenfalls das Element am Kopf der Deque (`"A"`, verbleibend `[C]`).
  - Die Ausgabe ist somit `B A`.


---

### Question 19
Consider the following map operations under Java 21:
```java
SequencedMap<Integer, String> map = new TreeMap<>();
map.put(1, "One");
map.put(2, "Two");
var reversed = map.reversed();
System.out.println(reversed.firstEntry().getValue());
```
What is the output of executing this code segment?
- A. `One`
- B. `Two`
- C. Throws `UnsupportedOperationException`.
- D. Compile-time error because `reversed()` is not available on `TreeMap`.

**Answer: B**
**Explanation (German/English):**
- **Sorted Map reversed view:** `TreeMap` implementiert `SequencedMap`. Der Aufruf von `reversed()` gibt eine umgekehrte Sicht der Map zurück, basierend auf der Sortierreihenfolge.
- Da `TreeMap` aufsteigend sortiert ist, ist die Reihenfolge `1=One, 2=Two`.
- Die umgekehrte Sicht `reversed` besitzt folglich die logische Reihenfolge `2=Two, 1=One`.
- Der erste Eintrag der umgekehrten Sicht (`firstEntry()`) ist daher `2=Two`, dessen Wert `"Two"` ist.

---

### Question 20
What is the result of executing the following code segment?
```java
import java.util.*;

public class MapEquals {
    public static void main(String[] args) {
        Map<Integer, String> m1 = Map.of(1, "One", 2, "Two");
        Map<Integer, String> m2 = new LinkedHashMap<>();
        m2.put(2, "Two");
        m2.put(1, "One");
        System.out.println(m1.equals(m2));
    }
}
```
- A. `true`
- B. `false`
- C. Throws `NullPointerException` at runtime.
- D. Compilation fails.

**Answer: A**
**Explanation (German/English):**
- **Map equality checks:** Zwei Maps gelten als gleich (`equals`), wenn sie dieselbe Größe besitzen und dieselben Key-Value-Paare enthalten.
- Die Einfügereihenfolge (Order) der Elemente spielt für den `equals`-Vergleich von Maps keine Rolle (anders als bei `List`).
- Da beide Maps genau die Schlüssel `1` und `2` mit den Werten `"One"` und `"Two"` enthalten, gibt der Vergleich `true` zurück.

