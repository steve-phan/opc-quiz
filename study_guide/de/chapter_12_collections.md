# Kapitel 12: Collections Framework & Sequenced Collections

## 1. Core Java 21 Prüfungsziele
- Die Interfaces des Collections-Frameworks beherrschen: `List`, `Set`, `Map` und `Queue`.
- Java 21 **Sequenced Collections** beherrschen (Interfaces, Operationen und die feste Reihenfolge beim Durchlauf / Encounter Order).
- Verschiedene Collection-Implementierungen vergleichen (z. B. `ArrayList` vs. `LinkedList`, `HashSet` vs. `TreeSet`).
- Benutzerdefiniertes Sortieren mittels der Interfaces `Comparable` und `Comparator` implementieren.

---

## 2. Detaillierte Konzepte

### Java 21 Sequenced Collections
Eine der wichtigsten Neuerungen in Java 21 ist die Einführung von **Sequenced Collections**. Zuvor war der Zugriff auf die ersten und letzten Elemente in einer Collection uneinheitlich geregelt. Beispielsweise verwendete man bei einer `List` den Aufruf `list.get(0)`, während man bei einem `LinkedHashSet` mühsam einen Iterator nutzen musste.

Java 21 führt drei neue Interfaces ein, um Collections mit einer klar definierten Durchlaufreihenfolge (Encounter Order) darzustellen:
1. **`SequencedCollection<E>`:** Erweitert `Collection<E>`. Fügt einheitliche Methoden hinzu:
   - `void addFirst(E)` / `void addLast(E)`
   - `E getFirst()` / `E getLast()`
   - `E removeFirst()` / `E removeLast()`
   - `SequencedCollection<E> reversed()` (Gibt eine umgedrehte Ansicht der Collection zurück, *ohne* die Elemente zu kopieren).
2. **`SequencedSet<E>`:** Erweitert `SequencedCollection<E>` und `Set<E>`. Wird von `LinkedHashSet` und `TreeSet` implementiert.
3. **`SequencedMap<K, V>`:** Erweitert `Map<K, V>`. Wird von `LinkedHashMap` und `TreeMap` implementiert. Ergänzt Methoden wie `firstEntry()`, `lastEntry()`, `pollFirstEntry()`, `pollLastEntry()` und `sequencedKeySet()`.

```
                    Collection
                        |
               SequencedCollection
             /          |          \
           List    SequencedSet    Queue
                        |
                   NavigableSet
```

### Vergleich der Collection-Klassen & Interna
- **`ArrayList`:** Basiert auf einem internen Array, dessen Größe dynamisch angepasst wird. Schneller wahlfreier Zugriff ($O(1)$), langsame Einfüge- und Löschoperationen in der Mitte der Liste ($O(N)$), da Elemente im Array verschoben werden müssen.
- **`HashSet`:** Basiert im Hintergrund auf einer **`HashMap`**. Wenn Sie ein Element in ein `HashSet` einfügen, legt Java dieses Element als Schlüssel in der dahinterliegenden `HashMap` ab und verwendet eine feste statische Dummy-Objektkonstante (`new Object()`) als Wert. Dies ist der Grund, warum Sets keine Duplikate enthalten und Zugriffszeiten in $O(1)$ besitzen.
- **`TreeSet`:** Basiert auf einem Rot-Schwarz-Baum. Elemente werden automatisch sortiert. Die Elemente müssen entweder das Interface `Comparable` implementieren oder es muss ein benutzerdefinierter `Comparator` übergeben werden.

---

## 3. JVM-Interna & Speicherlayout

### Speicher-Effizienz von `reversed()`
Ein wichtiges Detail für die OCP-Prüfung ist das Verhalten der Methode `.reversed()`:
- Wenn Sie `list.reversed()` aufrufen, allokiert die JVM **keine** neue Collection und kopiert auch keine Referenzen in ein neues Array (was einen Overhead von $O(N)$ an Speicher und Zeit verursachen würde).
- Stattdessen wird ein leichtgewichtiges **Wrapper-Objekt (reversed-order view)** zurückgegeben, das direkt auf die Original-Collection verweist.
- Operationen auf dieser umgedrehten Sicht wirken sich direkt auf die Original-Collection aus. Rufen Sie `list.reversed().addFirst("x")` auf, wird `"x"` an das *Ende* der Originalliste angehängt.

---

## 4. Knifflige OCP-Prüfungsfragen

### Frage 1
Was ist das Ergebnis der Ausführung des folgenden Java 21-Code-Segments?
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

**Antwort: C**
**Erklärung:**
- **TreeSet mit SequencedCollection-Operationen:** `TreeSet` implementiert `NavigableSet`, welches wiederum `SequencedSet` erweitert. Daher kompiliert der Aufruf `set.addFirst(0)` ohne Probleme.
- Zur Laufzeit wirft ein sortiertes Set (`TreeSet`) jedoch eine `UnsupportedOperationException` bei Aufrufen von `addFirst(E)` und `addLast(E)`.
- **Grund:** Die Position der Elemente in einem `TreeSet` wird ausschließlich durch deren natürlichen Vergleich (`Comparable`) oder den übergebenen `Comparator` bestimmt. Ein manuelles Positionieren am Anfang oder Ende des Sets ist nicht zulässig.

---

### Frage 2
Was ist die Ausgabe des folgenden Programms?
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

**Antwort: B**
**Erklärung:**
- **Map.merge-Regeln:** Die Methode `merge(key, value, BiFunction)` arbeitet nach folgenden Regeln:
  - Wenn der Key `"A"` vorhanden ist und einen Nicht-Null-Wert hat (`"Apple"`), wird die `BiFunction` aufgerufen. Da diese `null` zurückgibt, wird der Key `"A"` komplett aus der Map **entfernt**.
  - Wenn der Key `"B"` vorhanden ist, aber der Wert `null` ist (oder der Key fehlt), wird der übergebene Wert (`"Banana"`) direkt eingetragen. Die `BiFunction` wird **nicht** aufgerufen.
  - Wenn der Key `"C"` nicht in der Map existiert, wird der Wert (`"Cherry"`) direkt assoziiert. Die `BiFunction` wird ebenfalls **nicht** aufgerufen.
  - Am Ende hat die Map die Größe 2 und enthält `{B=Banana, C=Cherry}`.

---

### Frage 3
Betrachten Sie die folgenden Anweisungen zur Instanziierung von Java-Collections. Welche der Zeilen wird zur Laufzeit eine Exception werfen? (Wählen Sie alle zutreffenden Antworten)
- A. `List<String> list1 = List.of("A", null);`
- B. `List<String> list2 = Arrays.asList("A", null);`
- C. `List<String> list3 = Arrays.asList("A", "B"); list3.set(0, "C");`
- D. `List<String> list4 = Arrays.asList("A", "B"); list4.add("C");`
- E. `List<String> list5 = List.of("A", "B"); list5.set(0, "C");`

**Antwort: A, D, E**
**Erklärung:**
- **Option A wirft eine NullPointerException:** Die Factory-Methoden `List.of()`, `Set.of()` und `Map.of()` erlauben keinerlei `null`-Werte (weder als Keys noch als Values).
- **Option B wird erfolgreich ausgeführt:** `Arrays.asList()` erlaubt `null`-Elemente.
- **Option C wird erfolgreich ausgeführt:** `Arrays.asList()` liefert eine Liste mit fester Größe, die direkt auf dem darunterliegenden Array operiert. Werte können mit `set()` überschrieben werden.
- **Option D wirft eine UnsupportedOperationException:** Da die Liste von `Arrays.asList()` eine feste Größe hat, sind strukturelle Änderungen (wie `add()` oder `remove()`) verboten.
- **Option E wirft eine UnsupportedOperationException:** `List.of()` liefert eine vollständig unmodifizierbare Liste. Weder `add()` noch `set()` sind erlaubt.

---

### Frage 4
Was ist die Ausgabe des folgenden Programms?
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

**Antwort: C**
**Erklärung:**
- **Map.computeIfAbsent:**
  - Für Key `1` ist bereits ein Wert vorhanden (`10`). Die Funktion wird nicht ausgeführt.
  - Für Key `2` fehlt der Wert. Die Funktion berechnet `k * 2` (wobei `k` der Key `2` ist) = `4`. Der Eintrag `{2=4}` wird hinzugefügt.
- **Map.computeIfPresent:**
  - Für Key `2` ist der Wert vorhanden (`4`). Die `BiFunction` berechnet `k + v` (wobei `k` der Key `2` und `v` der aktuelle Wert `4` ist) = `6`. Der Wert wird auf `6` aktualisiert.
  - Am Ende enthält die Map `{1=10, 2=6}`.

---

### Frage 5
Welche der folgenden Klassen im Paket `java.util` implementieren unter Java 21 das Interface `SequencedCollection` NICHT? (Wählen Sie alle zutreffenden Antworten)
- A. `ArrayList`
- B. `LinkedList`
- C. `ArrayDeque`
- D. `PriorityQueue`
- E. `HashSet`

**Antwort: D, E**
**Erklärung:**
- **Anforderung an die Reihenfolge (Encounter Order):** Das Interface `SequencedCollection` setzt voraus, dass eine Collection eine wohldefinierte Reihenfolge der Elemente (Encounter Order) besitzt.
- **PriorityQueue (D):** Garantiert zwar, dass das kleinste Element am Kopf der Warteschlange steht, hat aber keine feste Reihenfolge für die restlichen Elemente (der Iterator liefert sie in unsortierter Reihenfolge). Daher implementiert `PriorityQueue` **nicht** `SequencedCollection`.
- **HashSet (E):** Ist ein ungeordnetes Set ohne feste Reihenfolge und implementiert `SequencedCollection` ebenfalls nicht. (Achtung: `LinkedHashSet` implementiert es hingegen schon, da es die Einfügereihenfolge beibehält).

---

### Frage 6
Was ist das Ergebnis der Ausführung des folgenden Code-Segments unter Java 21?
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
- D. `[A, X, C, D] | [D, C, X, A]` (nach dem Werfen einer Exception)
- E. `[A, X, C, D] | [D, C, X, A]` ist falsch; es ist eigentlich `[A, X, C, D] | [D, C, X, A]` aufgrund von Synchronisationsproblemen zur Laufzeit.
- F. `[A, X, C, D] | [D, C, X, A]` ist falsch. Der Code gibt aus: `[A, X, C, D] | [D, C, X, A]`, aber eigentlich gibt er `[A, X, C, D] | [D, C, X, A]` aus? Lassen Sie uns das überprüfen.

**Antwort: B** (oder genauer gesagt, die tatsächlich ausgegebenen Werte sind `[A, X, C, D] | [D, C, X, A]`)
**Erklärung:**
- **Verhalten der reversed-Ansicht (View):** `list.reversed()` erzeugt ein leichtgewichtiges Wrapper-Objekt (View), welches direkt auf die ursprüngliche Liste verweist.
- Modifikationen an der View schreiben direkt auf die Original-Liste durch. `rev.set(1, "X")` ersetzt das Element an Index 1 der umgedrehten Sicht (was Index 1 der Original-Liste entspricht). Die Original-Liste wird somit zu `[A, X, C]`.
- Modifikationen an der Original-Liste (`list.add("D")`) spiegeln sich sofort in der View wider. Die Original-Liste wird zu `[A, X, C, D]`, und die View spiegelt dies in umgekehrter Reihenfolge wider: `[D, C, X, A]`.

---

### Frage 7
Was ist die Ausgabe beim Kompilieren und Ausführen des folgenden Programms?
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

**Antwort: B**
**Erklärung:**
- **Null-Elemente in Collections:**
  - `LinkedList` (c1) erlaubt uneingeschränkt `null`-Elemente. Daher wird `C1` ausgegeben.
  - `ArrayDeque` (c2) verbietet `null`-Elemente strikt. Ein Aufruf von `add(null)` wirft sofort eine `NullPointerException`. Daher wird `E2` ausgegeben.
  - `TreeSet` (c3) sortiert seine Elemente. Da `null` nicht mit anderen Objekten verglichen werden kann, wirft `TreeSet` beim Einfügen von `null` eine `NullPointerException` (Ausnahme: Wenn ein spezieller Comparator übergeben wurde, der mit Null-Werten umgehen kann, was hier jedoch nicht der Fall ist). Daher wird `E3` ausgegeben.

---

### Frage 8
Betrachten Sie das folgende Programm:
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
Was ist das Ergebnis der Ausführung dieses Codes?
- A. Kompiliert und läuft erfolgreich ohne Ausgabe.
- B. Wirft eine `ConcurrentModificationException` zur Laufzeit.
- C. Wirft eine `UnsupportedOperationException` zur Laufzeit.
- D. Die Kompilierung schlägt fehl, da `var` in erweiterten for-Schleifen nicht verwendet werden kann.

**Antwort: B**
**Erklärung:**
- **Gleichzeitige Modifikation von Maps (Concurrent Modification):** Wenn eine Map über ihr `entrySet()`, `keySet()` oder `values()` iteriert wird, führt jede strukturelle Änderung der Map (wie `put()` für einen neuen Schlüssel oder `remove()`) während der Iteration zu einer `ConcurrentModificationException`.
- Das Ändern eines existierenden Werts für einen bereits vorhandenen Key ist erlaubt, das Hinzufügen eines neuen Keys (`"Four"`) hingegen ist eine strukturelle Änderung und wirft die Exception.

---

### Frage 9
Was ist das Ergebnis der Ausführung des folgenden Code-Segments unter Java 21?
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
- D. Wirft eine `UnsupportedOperationException` zur Laufzeit.

**Antwort: B**
**Erklärung:**
- **Einfügereihenfolge bei LinkedHashMap (Encounter Order):** `LinkedHashMap` speichert die Elemente in der Reihenfolge ihrer ersten Einfügung (Insertion Order).
- Das erneute Einfügen eines bereits existierenden Keys (`map.put("A", "Apple")`) überschreibt zwar den Wert des Schlüssels, verändert jedoch standardmäßig seine Position in der Einfügereihenfolge **nicht**.
- Daher bleibt `"A"` an der ersten Stelle stehen. Die Ausgabe lautet `[A, B]`.

---

### Frage 10
Was ist das Ergebnis beim Kompilieren und Ausführen der folgenden Klasse?
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
- C. Die Kompilierung schlägt fehl, da `Collections.sort` nur Listen mit Elementen akzeptiert, die `Comparable` implementieren.
- D. Wirft eine `ClassCastException` zur Laufzeit.

**Antwort: B**
**Erklärung:**
- **Comparator.reverseOrder():** 
  - Die Klasse `Item` implementiert `Comparable<Item>` korrekt (natürliche Sortierung aufsteigend nach `id`).
  - Der Aufruf `Collections.sort(list, Comparator.reverseOrder())` verwendet einen Comparator, der die natürliche Ordnung umkehrt.
  - Das Array wird somit absteigend sortiert, was zu `[2, 1]` führt. Der Code ist absolut gültig und kompiliert fehlerfrei.

---

### Frage 11
Was ist die Ausgabe des folgenden Programms?
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

**Antwort: B**
**Erklärung:**
- **Wrapper vs. Kopie bei Collections:**
  - `Collections.unmodifiableList()` erzeugt ein **Wrapper-View-Objekt** um die Original-Liste, keine Kopie.
  - Modifikationen auf der unmodifizierbaren Referenz (`unmodifiable.add("C")`) sind verboten und werfen eine `UnsupportedOperationException` (Ausgabe `UOE`).
  - Änderungen an der Original-Liste (`original.add("B")`) werden jedoch direkt an die zugrundeliegende Liste geschrieben und sind über die unmodifizierbare View sichtbar. Daher wächst die Größe auf 2.

---

### Frage 12
Gegeben ist der folgende Code-Block:
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
Was ist die Ausgabe dieses Codes?
- A. `2`
- B. `CME`
- C. `3`
- D. `1`

**Antwort: B**
**Erklärung:**
- **Ungültigwerden von subList-Views:**
  - `list.subList(1, 3)` liefert eine View auf einen Teilbereich der Originalliste (Elemente `"B"`, `"C"`).
  - Änderungen über die Subliste (`sub.set(0, "X")`) spiegeln sich in der Originalliste wider.
  - Wenn jedoch die **Originalliste strukturell verändert** wird (z. B. durch `list.remove("D")`), während die Subliste noch aktiv ist, wird die Subliste sofort ungültig (ihre internen Zähler stimmen nicht mehr mit der Originalliste überein).
  - Jeder nachfolgende Lese- oder Schreibzugriff auf die Subliste (`sub.size()`) wirft daraufhin eine `ConcurrentModificationException` (`CME`).

---

### Frage 13
Was ist das Ergebnis beim Versuch, den folgenden Code zu kompilieren und auszuführen?
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
- A. Kompiliert erfolgreich und gibt `E1 E2` aus.
- B. Die Kompilierung schlägt fehl.
- C. Gibt nur `E1` aus.
- D. Gibt nur `E2` aus.

**Antwort: A**
**Erklärung:**
- **Null-Werte in Map-Implementierungen:**
  - `TreeMap` (map1) sortiert Schlüssel anhand ihrer natürlichen Ordnung. Da `null` nicht verglichen werden kann, wirft `TreeMap` beim Einfügen eines `null`-Keys eine `NullPointerException` (Ausgabe `E1`).
  - `Hashtable` (map2) erlaubt generell **weder null-Keys noch null-Values**. Ein Versuch, ein `null`-Value einzufügen, wirft eine `NullPointerException` (Ausgabe `E2`).
  - (Hinweis: `HashMap` erlaubt einen `null`-Key und beliebig viele `null`-Values).

---

### Frage 14
Betrachten Sie das folgende Programm:
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
Was ist das Ergebnis der Ausführung dieses Codes?
- A. `1 Second`
- B. `2 First`
- C. `2 Second`
- D. `1 First`

**Antwort: B**
**Erklärung:**
- **HashMap-Kollisionsbehandlung:**
  - `k1` und `k2` besitzen denselben Hashcode (`1 % 2 = 1` und `3 % 2 = 1`). Sie fallen somit in denselben Bucket der `HashMap` (Kollision).
  - Der `equals()`-Vergleich zwischen `k1` (val=1) und `k2` (val=3) liefert jedoch `false`.
  - Da sie nicht gleich (`equals`) sind, werden sie als zwei separate Einträge im selben Bucket der Map gespeichert. Die Größe der Map beträgt somit `2`.
  - `map.get(k1)` sucht nach einem Key, der gleich `k1` ist, findet den ersten Eintrag und gibt `"First"` zurück.

---

### Frage 15
Was ist das Ergebnis beim Kompilieren und Ausführen des folgenden Programms?
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

**Antwort: A**
**Erklärung:**
- **NavigableSet-Grenzwertmethoden:**
  - `lower(E)`: Sucht das größte Element, das strikt kleiner als `E` ist (`lower(20)` -> `10`).
  - `floor(E)`: Sucht das größte Element, das kleiner oder gleich `E` ist (`floor(20)` -> `20`).
  - `ceiling(E)`: Sucht das kleinste Element, das größer oder gleich `E` ist (`ceiling(20)` -> `20`).
  - `higher(E)`: Sucht das kleinste Element, das strikt größer als `E` ist (`higher(20)` -> `30`).
  - Die Ausgabe lautet folglich `10 20 20 30`.

---

### Frage 16
Was gibt der folgende Code aus?
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
- D. Wirft eine `ClassCastException` zur Laufzeit.

**Antwort: A**
**Erklärung:**
- **Überladungen von List.remove:** Das `List`-Interface besitzt zwei überladene `remove`-Methoden:
  - `remove(int index)`: Entfernt das Element an einem bestimmten Index.
  - `remove(Object o)`: Entfernt das erste Vorkommen eines bestimmten Objekts.
- Wenn ein primitives `int` (`1`) übergeben wird, wählt der Compiler die Methode `remove(int index)`. Es wird also das Element an Index 1 (Wert `2`) gelöscht. Das verbleibende Ergebnis ist `[1, 3]`.
- Um das Objekt mit dem Wert `1` zu entfernen, müsste man explizit `list.remove(Integer.valueOf(1))` aufrufen.

---

### Frage 17
Gegeben ist die folgende Comparator-Definition. Was ist die Ausgabe nach dem Sortieren der Liste `["A", null, "B"]`?
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
- C. Wirft eine `NullPointerException` zur Laufzeit.
- D. `[null, B, A]`

**Antwort: B**
**Erklärung:**
- **Sortieren von Null-Werten:** Standard-Comparatoren werfen beim Vergleichen von `null` eine `NullPointerException`.
- `Comparator.nullsFirst(...)` erzeugt einen null-sicheren Comparator, der alle `null`-Werte an den Anfang der sortierten Reihenfolge einsortiert.
- Der Rest der Liste wird nach der übergebenen Reihenfolge (`naturalOrder()`, also alphabetisch) sortiert.
- Das Ergebnis ist somit `[null, A, B]`.

---

### Frage 18
Was ist die Ausgabe beim Kompilieren und Ausführen des folgenden Codes?
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

**Antwort: A**
**Erklärung:**
- **Zweiseitige Deque-Operationen (Double-Ended):**
  - `stack.push("A")` fügt `"A"` am Kopf (Front) der Deque hinzu (`[A]`).
  - `stack.push("B")` fügt `"B"` ebenfalls am Kopf hinzu (`[B, A]`).
  - `stack.offer("C")` fügt `"C"` am Ende (Tail) der Deque hinzu (Warteschlangen-Verhalten) (`[B, A, C]`).
  - `stack.pop()` entfernt und liefert das Element am Kopf der Deque (`"B"`, verbleibend `[A, C]`).
  - `stack.poll()` entfernt und liefert ebenfalls das Element am Kopf der Deque (`"A"`, verbleibend `[C]`).
  - Die Ausgabe ist somit `B A`.

---

### Frage 19
Betrachten Sie die folgenden Map-Operationen unter Java 21:
```java
SequencedMap<Integer, String> map = new TreeMap<>();
map.put(1, "One");
map.put(2, "Two");
var reversed = map.reversed();
System.out.println(reversed.firstEntry().getValue());
```
Was ist die Ausgabe bei der Ausführung dieses Code-Segments?
- A. `One`
- B. `Two`
- C. Wirft eine `UnsupportedOperationException`.
- D. Kompilierungsfehler, da `reversed()` für `TreeMap` nicht verfügbar ist.

**Antwort: B**
**Erklärung:**
- **Umgedrehte Sicht einer sortierten Map:** `TreeMap` implementiert `SequencedMap`. Der Aufruf von `reversed()` gibt eine umgekehrte Sicht der Map zurück, basierend auf der Sortierreihenfolge.
- Da `TreeMap` aufsteigend sortiert ist, ist die Reihenfolge `1=One, 2=Two`.
- Die umgekehrte Sicht `reversed` besitzt folglich die logische Reihenfolge `2=Two, 1=One`.
- Der erste Eintrag der umgekehrten Sicht (`firstEntry()`) ist daher `2=Two`, dessen Wert `"Two"` ist.

---

### Frage 20
Was ist das Ergebnis der Ausführung des folgenden Code-Segments?
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
- C. Wirft eine `NullPointerException` zur Laufzeit.
- D. Kompilierung schlägt fehl.

**Antwort: A**
**Erklärung:**
- **Gleichheitsprüfung bei Maps:** Zwei Maps gelten als gleich (`equals`), wenn sie dieselbe Größe besitzen und dieselben Key-Value-Paare enthalten.
- Die Einfügereihenfolge (Order) der Elemente spielt für den `equals`-Vergleich von Maps keine Rolle (anders als bei `List`).
- Da beide Maps genau die Schlüssel `1` und `2` mit den Werten `"One"` und `"Two"` enthalten, gibt der Vergleich `true` zurück.

