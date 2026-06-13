# Kapitel 11: Generics & Type Erasure

## 1. Core Java 21 Prüfungsziele
- Generische Klassen, Interfaces und Methoden erstellen und verwenden.
- Wildcards beherrschen: ungebunden (`?`), nach oben begrenzt (`? extends T`) und nach unten begrenzt (`? super T`).
- Die PECS-Regel (Producer Extends, Consumer Super) anwenden.
- JVM Type Erasure (Typ-Löschung) und vom Compiler generierte Brückenmethoden (Bridge Methods) erklären.

---

## 2. Detaillierte Konzepte

### Wildcards: Nach oben begrenzt vs. nach unten begrenzt
Wildcards werden verwendet, um Einschränkungen für generische Typargumente festzulegen, was Polymorphie bei Generics ermöglicht.

#### 1. Nach oben begrenzte Wildcard (Upper-Bounded Wildcard: `? extends T`)
- Beschränkt den Typ auf eine Unterklasse von `T` (oder `T` selbst).
- **Read-Only (Nur Lesen):** Sie können Elemente sicher als Typ `T` aus der Collection *lesen*, aber Sie **können keine** Elemente in die Collection *schreiben* (außer `null`), da der Compiler den genauen Unterklassentyp zur Laufzeit nicht garantieren kann.

#### 2. Nach unten begrenzte Wildcard (Lower-Bounded Wildcard: `? super T`)
- Beschränkt den Typ auf eine Oberklasse von `T` (oder `T` selbst).
- **Write-Safe (Schreibsicher):** Sie können Elemente vom Typ `T` (oder Unterklassen von `T`) sicher in die Collection *schreiben*. Das *Lesen* aus der Collection liefert jedoch nur den Typ `Object`, da der Compiler nicht garantieren kann, welcher konkrete Oberklassentyp vorliegt.

#### Die PECS-Regel:
- **P**roducer **E**xtends: Wenn Ihre generische Struktur Daten produziert (Sie lesen nur daraus), verwenden Sie `? extends T`.
- **C**onsumer **S**uper: Wenn Ihre generische Struktur Daten konsumiert (Sie schreiben hinein), verwenden Sie `? super T`.

```java
// Producer: Elemente lesen
public void printBooks(List<? extends Book> books) {
    for (Book b : books) { // Gültig: Lesen als Book
        System.out.println(b.getTitle());
    }
    // books.add(new Book("Java", 10)); // Kompilierfehler! Schreiben nicht erlaubt.
}

// Consumer: Elemente schreiben
public void addBooks(List<? super Book> books) {
    books.add(new Book("Java OCP 21", 50.0)); // Gültig: Schreiben von Book
    // Object obj = books.get(0); // Liefert nur Object, Lesen als Book nicht möglich.
}
```

---

## 3. JVM-Interna & Speicherlayout

### Type Erasure (Typ-Löschung)
Java-Generics wurden mit Java 5 eingeführt und so konzipiert, dass die Abwärtskomlitibilität gewahrt bleibt. Unter **Type Erasure** entfernt der Compiler während der Kompilierung alle generischen Typinformationen.
1. Der Compiler ersetzt Typparameter durch ihre erste Schranke (in der Regel `Object` oder die in `extends` angegebene Klasse).
2. Der Compiler fügt beim Abrufen von Werten bei Bedarf explizite Casts ein.
3. Aufgrund von Type Erasure sind generische Typargumente **zur Laufzeit nicht verfügbar**. Code wie `if (list instanceof List<String>)` oder `new T()` führt zu einem Kompilierfehler.

```
+-------------------------------------------------------------+
| JVM TYPE ERASURE PROZESS                                    |
|                                                             |
| Quellcode (Kompilierzeit):                                  |
| class Box<T extends Book> {                                 |
|     private T content;                                      |
|     public T get() { return content; }                      |
| }                                                           |
|                                                             |
| Kompilierter Bytecode (Laufzeit):                           |
| class Box {                                                 |
|     private Book content; // T ersetzt durch Schranke Book  |
|     public Book get() { return content; }                   |
| }                                                           +-------------------------------------------------------------+
```

### Vom Compiler generierte Brückenmethoden (Bridge Methods)
Um das polymorphe Verhalten bei Klassen zu bewahren, die parametrisierte Klassen erweitern, generiert der Compiler automatisch synthetische **Brückenmethoden (Bridge Methods)**.
Betrachten wir:
```java
class Node<T> {
    public void set(T value) {}
}
class IntNode extends Node<Integer> {
    public void set(Integer value) {}
}
```
Nach der Typ-Löschung besitzt `Node` die Methode `set(Object)`. `IntNode` hat jedoch die Methode `set(Integer)`. Da sich die Signaturen unterscheiden, würde `IntNode` die Methode `Node.set()` nicht mehr überschreiben, was die Polymorphie verletzen würde.
Um dies zu beheben, generiert der Compiler eine Brückenmethode in `IntNode`:
```java
public void set(Object value) {
    this.set((Integer) value); // Castet und delegiert
}
```

---

## 4. Schwierige OCP-Prüfungsfragen

### Frage 1
Was ist das Ergebnis des Versuchs, die folgende Klasse zu kompilieren und auszuführen?
```java
public class Container<T> {
    private T value;
    private static T defaultValue;
    
    public Container(T value) {
        this.value = value;
    }
    
    public static T getDefaultValue() {
        return defaultValue;
    }
    
    public static <U> U getSpecified(U obj) {
        return obj;
    }
}
```
- A. Kompiliert erfolgreich.
- B. Die Kompilierung schlägt nur bei der Deklaration von `defaultValue` fehl.
- C. Die Kompilierung schlägt nur bei der Deklaration von `getDefaultValue()` fehl.
- D. Die Kompilierung schlägt sowohl bei `defaultValue` als auch bei `getDefaultValue()` fehl.

**Answer: D**
**Explanation (German/English):**
- **Static Context with Generics:** Statische Variablen und Methoden gehören zur Klasse selbst und werden zwischen allen Instanzen geteilt.
- Da der Typparameter `T` an die Instanziierung der Klasse gebunden ist (z. B. `new Container<String>()`), existiert `T` im statischen Kontext nicht.
- Statische Felder (`defaultValue`) dürfen den Typparameter `T` der Klasse nicht verwenden.
- Statische Methoden (`getDefaultValue()`) dürfen `T` ebenfalls nicht als Rückgabe- oder Parametertyp verwenden, es sei denn, sie deklarieren einen eigenen Typparameter (wie in `getSpecified()`, wo `<U>` eine eigenständige statische Deklaration ist). Daher schlägt die Kompilierung an beiden Stellen fehl.

---

### Frage 2
Was ist das Ergebnis des Kompilierens des folgenden Code-Segments?
```java
import java.util.List;

public class OverloadTest {
    public void process(List<String> list) {}
    public void process(List<Integer> list) {}
}
```
- A. Kompiliert erfolgreich; beide Methoden sind überladen.
- B. Compilerfehler aufgrund von Type Erasure.
- C. Kompiliert erfolgreich, wirft aber eine Laufzeitwarnung.
- D. Die Kompilierung schlägt fehl, da `List` ein Raw-Type ist.

**Answer: B**
**Explanation (German/English):**
- **Type Erasure Overload Conflict:** Durch den Prozess der Type Erasure (Typ-Löschung) ersetzt der Compiler alle Typparameter durch ihre Schranken (hier `Object`).
- Nach der Übersetzung besitzen beide Methoden die identische Signatur `process(List list)` im Bytecode.
- Da Java keine zwei Methoden mit derselben gelöschten Signatur in derselben Klasse zulässt, meldet der Compiler einen Fehler ("both methods have same erasure").

---

### Frage 3
Welche der folgenden Anweisungen kompilieren erfolgreich? (Wählen Sie alle zutreffenden Antworten)
```java
List<String> list = new ArrayList<>();
```
- A. `boolean b1 = list instanceof List;`
- B. `boolean b2 = list instanceof List<String>;`
- C. `boolean b3 = list instanceof List<?>;`
- D. `boolean b4 = list instanceof List<? extends Object>;`

**Answer: A, C**
**Explanation (German/English):**
- **Instanceof restrictions with Generics:** Aufgrund der Typ-Löschung zur Laufzeit kann der JVM-Befehl `instanceof` die generischen Typen zur Laufzeit nicht überprüfen.
- **Option A compiles:** Der Test gegen den rohen Typ (`List`) ist erlaubt, da die Klasse `List` zur Laufzeit existiert.
- **Option B fails to compile:** Der Test gegen einen parametrisierten Typ (`List<String>`) ist verboten, da die Information `<String>` zur Laufzeit gelöscht ist.
- **Option C compiles:** Der Test gegen den ungebundenen Wildcard-Typ (`List<?>`) ist erlaubt, da er semantisch äquivalent zum rohen Typ ist und keine spezifische Typprüfung erfordert.
- **Option D fails to compile:** Ein gebundener Wildcard (`List<? extends Object>`) ist nicht reifizierbar und führt zu einem Compilerfehler.

---

### Frage 4
Welche der folgenden Array-Deklarationen kompilieren fehlerfrei? (Wählen Sie alle zutreffenden Antworten)
- A. `List<String>[] arr1 = new ArrayList<String>[10];`
- B. `List<?>[] arr2 = new ArrayList<?>[10];`
- C. `List<? extends Number>[] arr3 = new ArrayList<? extends Number>[10];`
- D. `List<String>[] arr4 = (List<String>[]) new ArrayList[10];`

**Answer: B, D**
**Explanation (German/English):**
- **Generic Array Creation:** In Java ist das direkte Erzeugen von Arrays mit parametrisierten Typen (wie `new ArrayList<String>[10]` oder `new ArrayList<? extends Number>[10]`) verboten, da generische Typen nicht reifizierbar sind. Dies würde die Typensicherheit des Arrays zur Laufzeit untergraben (Gefahr von `ArrayStoreException` Umgehung).
- **Option B compiles:** Arrays von ungebundenen Wildcards (`List<?>[]`) sind erlaubt, da `List<?>` als reifizierbar gilt (es gibt keine spezifischen Typinformationen, die gelöscht werden könnten).
- **Option D compiles (with warning):** Das Erzeugen eines Raw-Arrays (`new ArrayList[10]`) und das anschließende Casten auf `List<String>[]` kompiliert mit einer "unchecked cast"-Warnung. Dies ist der typische Workaround.

---

### Frage 5
Betrachten Sie die folgende Klassenhierarchie:
```java
class Vehicle {}
class Car extends Vehicle {}
class SportsCar extends Car {}
```
Gegeben sei die Deklaration:
```java
List<? super Car> list = new ArrayList<Vehicle>();
```
Welche der folgenden Zeilen kompilieren? (Wählen Sie alle zutreffenden Antworten)
- A. `list.add(new Vehicle());`
- B. `list.add(new Car());`
- C. `list.add(new SportsCar());`
- D. `Car car = list.get(0);`
- E. `Object obj = list.get(0);`

**Answer: B, C, E**
**Explanation (German/English):**
- **PECS (Consumer Super):** Eine Liste deklariert mit `? super Car` kann Elemente aufnehmen, die vom Typ `Car` oder einer Unterklasse von `Car` sind.
- **Writing (Add):**
  - Der Compiler weiß, dass die Liste einen Typ referenziert, der eine Superklasse von `Car` ist (z. B. `Car`, `Vehicle` oder `Object`).
  - Es ist daher absolut sicher, ein `Car` (B) oder ein `SportsCar` (C) hinzuzufügen, da diese in jede dieser Superklassen passen.
  - Das Hinzufügen von `Vehicle` (A) schlägt fehl, da die Liste zur Laufzeit vom Typ `List<Car>` sein könnte und ein `Vehicle` dort nicht hineinpasst.
- **Reading (Get):**
  - Da die Liste eine beliebige Superklasse von `Car` referenzieren kann, kann der Compiler beim Lesen keine spezifischere Garantie geben als `Object`. Daher scheitert D und E ist korrekt.

---

### Frage 6
Unter Verwendung derselben Klassenhierarchie:
```java
class Vehicle {}
class Car extends Vehicle {}
class SportsCar extends Car {}
```
Gegeben sei die Deklaration:
```java
List<? extends Car> list = new ArrayList<SportsCar>();
```
Welche der folgenden Zeilen kompilieren? (Wählen Sie alle zutreffenden Antworten)
- A. `list.add(new SportsCar());`
- B. `list.add(null);`
- C. `Car c = list.get(0);`
- D. `SportsCar sc = list.get(0);`

**Answer: B, C**
**Explanation (German/English):**
- **PECS (Producer Extends):** Eine Liste deklariert mit `? extends Car` dient als Produzent (Lesen).
- **Writing (Add):**
  - Sie dürfen keine Elemente (außer dem literalen `null`) zu einer `? extends`-Liste hinzufügen.
  - Auch wenn die zugrundeliegende Liste ein `ArrayList<SportsCar>` ist, weiß der Compiler nur, dass die Liste eine Unterklasse von `Car` enthält (was z. B. auch eine andere hypothetische Unterklasse wie `Truck` sein könnte). Daher ist A ungültig und B gültig.
- **Reading (Get):**
  - Jedes Element in dieser Liste ist garantiert eine Unterklasse von `Car` (oder `Car` selbst). Daher kann das Ergebnis sicher einer `Car`-Referenz zugewiesen werden (C ist gültig).
  - Eine Zuweisung an `SportsCar` (D) erfordert einen expliziten Cast, da das Element zur Laufzeit auch ein einfaches `Car` oder ein anderes Subjekt sein könnte.

---

### Frage 7
Betrachten Sie den folgenden Versuch, die Elemente in einer Wildcard-Liste zu vertauschen:
```java
public class Swapper {
    public static void swapFirstTwo(List<?> list) {
        if (list.size() >= 2) {
            Object temp = list.get(0);
            list.set(0, list.get(1)); // Line A
            list.set(1, temp);        // Line B
        }
    }
}
```
Was ist das Ergebnis des Kompilierens dieser Klasse?
- A. Kompiliert erfolgreich.
- B. Compilerfehler in Line A und Line B aufgrund eines Wildcard-Capture-Fehlers.
- C. Kompiliert erfolgreich, wenn wir `List<?>` in `List<Object>` ändern.
- D. Sowohl B als auch C sind korrekt.

**Answer: D**
**Explanation (German/English):**
- **Wildcard Capture Error:** Der Compiler kann ein Element nicht in eine Liste schreiben, deren Typ als `?` (ungebunden) deklariert ist. Der Typ `?` repräsentiert einen unbekannten spezifischen Typ (z. B. `List<String>`). Wenn wir versuchen, ein `Object` hineinzuschreiben, verweigert der Compiler dies, um die Typensicherheit zu garantieren.
- Dies nennt man ein **Capture-Problem**.
- Wenn wir den Typ zu `List<Object>` ändern, weiß der Compiler, dass die Liste explizit für `Object` deklariert ist und erlaubt Schreibzugriffe mit beliebigen Objekten (C ist korrekt). Alternativ kann dieses Problem durch eine private Hilfsmethode gelöst werden: `private static <T> void swapHelper(List<T> list)`.

---

### Frage 8
Betrachten Sie diese Methodendeklaration:
```java
public static <T extends Comparable<? super T>> T max(List<? extends T> list)
```
Warum wird die rekursive Schranke als `Comparable<? super T>` statt `Comparable<T>` angegeben?
- A. Es gibt keinen funktionalen Unterschied; beide kompilieren identisch.
- B. Sie erlaubt die Verwendung von Klassentypen, die `Comparable` von einer Superklasse erben.
- C. Sie ermöglicht die Überprüfung der Typkompatibilität zur Laufzeit via Reflection.
- D. Sie verhindert eine ClassCastException zur Laufzeit.

**Answer: B**
**Explanation (German/English):**
- **Recursive Generic Bounds:**
  - Angenommen, wir haben eine Klasse `Parent implements Comparable<Parent>` und eine Unterklasse `Child extends Parent`.
  - Da `Child` kein `Comparable<Child>` implementiert, sondern das `Comparable<Parent>` von seiner Elternklasse erbt, würde ein Typ `T` als `Child` mit der Bedingung `<T extends Comparable<T>>` die Schranke verletzen und einen Compilerfehler erzeugen.
  - Die Schranke `Comparable<? super T>` erlaubt es, dass die Klasse `Comparable` für einen Supertyp von `T` implementiert ist (in diesem Fall `Parent`, welches ein Supertyp von `Child` ist). Dies erhöht die Wiederverwendbarkeit von generischen Algorithmen erheblich.

---

### Frage 9
Wie verhält sich das folgende Code-Programm?
```java
import java.util.*;

public class HeapPollution {
    public static void main(String[] args) {
        List rawList = new ArrayList<String>();
        rawList.add(10); 
        
        List<String> strList = rawList; 
        try {
            String s = strList.get(0);
            System.out.println("Success: " + s);
        } catch (ClassCastException e) {
            System.out.println("ClassCastException");
        }
    }
}
```
- A. Die Kompilierung schlägt fehl.
- B. Gibt `Success: 10` aus.
- C. Gibt `ClassCastException` aus.
- D. Wirft eine ClassCastException während `rawList.add(10)`.

**Answer: C**
**Explanation (German/English):**
- **Heap Pollution:**
  - Der Code kompiliert mit Warnungen ("unchecked warning"), da wir generische Typen mit Raw-Types mischen.
  - Das Hinzufügen von `10` (Integer) in `rawList` gelingt zur Laufzeit, da durch Type Erasure die Liste intern als einfaches `ArrayList` (für `Object`) vorliegt.
  - Die Zuweisung `List<String> strList = rawList` gelingt ebenfalls ohne Exception zur Laufzeit, da Typinformationen gelöscht sind.
  - Die `ClassCastException` wird erst in der Zeile `String s = strList.get(0);` geworfen. Hier fügt der Compiler einen impliziten Cast `(String)` ein, da `strList` als `List<String>` deklariert ist. Da das zurückgegebene Objekt jedoch ein `Integer` ist, schlägt dieser Cast fehl.

---

### Frage 10
Welche der folgenden Zuweisungen kompilieren ohne Fehler oder Warnungen?
- A. `List<Object> list = new ArrayList<String>();`
- B. `List<? extends Object> list = new ArrayList<String>();`
- C. `List<? super String> list = new ArrayList<Object>();`
- D. `List<String> list = new ArrayList();`

**Answer: B, C**
**Explanation (German/English):**
- **Option A fails to compile:** Generics sind invariant. `List<Object>` ist keine Superklasse von `List<String>`, obwohl `Object` eine Superklasse von `String` ist.
- **Option B compiles:** `? extends Object` erlaubt kovariante Zuweisungen. Jede Liste eines Typs, der `Object` erweitert, kann zugewiesen werden.
- **Option C compiles:** `? super String` erlaubt kontravariante Zuweisungen. Jede Liste eines Typs, der ein Supertyp von `String` ist (wie `Object`), kann zugewiesen werden.
- **Option D compiles with warning:** Die Zuweisung einer rohen `ArrayList` zu einer generischen Referenz kompiliert zwar, erzeugt jedoch eine unüberprüfte Warnung ("unchecked conversion").

---

### Frage 11
Gegeben sei der folgende Code-Block:
```java
public class MyNode<T extends Number> {
    private T data;
    public MyNode(T data) { this.data = data; }
    public void setData(T data) { this.data = data; }
}
```
Was ist die Signatur von `setData` in der kompilierten `.class`-Datei nach der Typ-Löschung (Type Erasure)?
- A. `public void setData(Object data)`
- B. `public void setData(Number data)`
- C. `public void setData(T data)`
- D. Die Methode wird gelöscht.

**Answer: B**
**Explanation (German/English):**
- **Erasure to Bound:** Wenn ein Typparameter eine obere Schranke besitzt (z. B. `<T extends Number>`), ersetzt der Compiler den Typparameter `T` durch die erste obere Schranke (`Number`).
- Wenn keine Schranke angegeben ist (z. B. `<T>`), wird sie durch `Object` ersetzt.
- Daher wird `setData(T)` zu `setData(Number)`.

---

### Frage 12
Welche der folgenden Aussagen über JVM-Brückenmethoden (Bridge Methods) ist wahr?
- A. Sie werden von Entwicklern manuell geschrieben, um die Abwärtskompatibilität zu unterstützen.
- B. Sie werden vom Compiler zur Kompilierzeit generiert, um polymorphes Verhalten zu bewahren.
- C. Sie umgehen Type Erasure zur Laufzeit.
- D. Sie verhindern Heap Pollution.

**Answer: B**
**Explanation (German/English):**
- **Bridge Methods (Brückenmethoden):** Da Java-Generics zur Laufzeit gelöscht werden, können Vererbungsszenarien entstehen, in denen Signaturen nicht mehr übereinstimmen (z. B. eine Unterklasse überschreibt eine Methode mit einem spezifischeren Typen als die gelöschte Superklasse).
- Um Polymorphie und dynamischen Dispatch aufrechtzuerhalten, generiert der Java-Compiler synthetische Brückenmethoden im Bytecode der Unterklasse, die die gelöschte Signatur der Superklasse implementieren und den Aufruf (mit Cast) an die spezifische Methode delegieren.

---

### Frage 13
Betrachten Sie die folgende Implementierung einer generischen Klasse:
```java
public class Creator<T> {
    public void execute() {
        try {
            T obj = new T(); // Line 1
            T[] arr = new T[5]; // Line 2
            boolean check = obj instanceof T; // Line 3
        } catch (Exception e) {}
    }
}
```
Welche Zeilen in dieser Klasse verursachen Compilerfehler?
- A. Nur Line 1
- B. Nur Line 1 und Line 2
- C. Nur Line 2 und Line 3
- D. Line 1, Line 2 und Line 3

**Answer: D**
**Explanation (German/English):**
- **Generics Restrictions:** Aufgrund von Type Erasure sind Typparameter (`T`) zur Laufzeit nicht physisch präsent. Daher gelten folgende Einschränkungen:
  - `new T()` (Line 1) ist illegal, da der Compiler nicht weiß, welcher Konstruktor aufgerufen werden soll und der Typ zur Laufzeit nicht bekannt ist.
  - `new T[5]` (Line 2) ist illegal, da Arrays ihren Komponententyp zur Laufzeit kennen müssen (Reifizierbarkeit).
  - `instanceof T` (Line 3) ist illegal, da die JVM den gelöschten Typen zur Laufzeit nicht überprüfen kann.

---

### Frage 14
Was ist das Ergebnis des Versuchs, den folgenden Code zu kompilieren?
```java
public class MultiBound<T extends Runnable & Cloneable> {
    private T entity;
    
    public void start() {
        entity.run();
    }
}
```
- A. Die Kompilierung schlägt fehl, da ein Typparameter nur eine Schranke haben kann.
- B. Die Kompilierung schlägt fehl, da Interfaces nicht als Schranken verwendet werden können.
- C. Kompiliert erfolgreich.
- D. Die Kompilierung schlägt fehl, da die Schranken durch Kommas anstelle von kaufmännischen Und-Zeichen (&) getrennt werden müssen.

**Answer: C**
**Explanation (German/English):**
- **Multiple Bounds:** Java erlaubt es, einem Typparameter mehrere Schranken (Multiple Bounds) zuzuweisen.
- Die Syntax dafür verwendet das Kaufmanns-Und-Zeichen (`&`), z. B. `<T extends A & B & C>`.
- **Regel:** Wenn eine der Schranken eine konkrete Klasse ist, muss diese als erstes deklariert werden. Da hier jedoch beide Schranken Interfaces sind (`Runnable` und `Cloneable`), ist die Reihenfolge beliebig und der Code kompiliert einwandfrei.

---

### Frage 15
Was ist die Ausgabe des Kompilierens und Ausführens des folgenden Codes?
```java
import java.util.*;

public class Test {
    public static void main(String[] args) {
        List<String> list1 = new ArrayList<>();
        List<Integer> list2 = new ArrayList<>();
        System.out.println(list1.getClass() == list2.getClass());
    }
}
```
- A. `true`
- B. `false`
- C. Die Kompilierung schlägt fehl, da Klassentypen nicht mit `==` verglichen werden können.
- D. Wirft eine ClassCastException zur Laufzeit.

**Answer: A**
**Explanation (German/English):**
- **Single Runtime Class Representing Generics:** Durch die Typ-Löschung (Type Erasure) existieren die generischen Typparameter `<String>` und `<Integer>` zur Laufzeit nicht.
- Beide Instanzen werden zur Laufzeit durch dieselbe Klasse `java.util.ArrayList` repräsentiert.
- Der Aufruf von `getClass()` liefert für beide Objekte das Klassenobjekt von `ArrayList`. Daher gibt der Vergleich `==` den Wert `true` zurück.

---

### Frage 16
Was ist das Ergebnis des Versuchs, den folgenden Code zu kompilieren und auszuführen?
```java
import java.util.*;

public class WildcardMix {
    public static void main(String[] args) {
        List<? extends Number> list1 = new ArrayList<Integer>();
        List<? super Integer> list2 = list1; // Line 1
        System.out.println("Finished");
    }
}
```
- A. Kompiliert erfolgreich.
- B. Die Kompilierung schlägt in Line 1 fehl.
- C. Wirft eine `ClassCastException` zur Laufzeit.
- D. Wirft eine `UnsupportedOperationException` zur Laufzeit.

**Answer: B**
**Explanation (German/English):**
- **Wildcard Compatibility:**
  - `list1` ist als `List<? extends Number>` deklariert. Dies kann eine Liste von beliebigen Unterklassen von `Number` sein (z. B. `List<Double>`).
  - `list2` ist als `List<? super Integer>` deklariert. Dies verlangt eine Liste eines Typs, der ein Supertyp von `Integer` ist (z. B. `List<Integer>`, `List<Number>`, `List<Object>`).
  - Der Compiler verhindert die Zuweisung in Line 1, da `list1` beispielsweise eine `List<Double>` referenzieren könnte. Eine `List<Double>` ist jedoch nicht mit `List<? super Integer>` kompatibel (da `Double` kein Supertyp von `Integer` ist). Daher schlägt die Kompilierung fehl.

---

### Frage 17
Gegeben sei die folgende Codestruktur:
```java
import java.util.*;

public class Test {
    public static void printElements(List<? extends Object> list) {
        for (Object obj : list) {
            System.out.print(obj + " ");
        }
    }
    
    public static void main(String[] args) {
        List<String> strings = List.of("A", "B");
        printElements(strings);
    }
}
```
Welche der folgenden Alternativen für den Parametertyp von `printElements` würden es dem Programm ermöglichen, identisch zu kompilieren und zu laufen? (Wählen Sie alle zutreffenden Antworten)
- A. `List<Object> list`
- B. `List<?> list`
- C. `List list`
- D. `List<? super Object> list`

**Answer: B, C**
**Explanation (German/English):**
- **Option A fails:** `List<Object>` akzeptiert aufgrund der Invarianz keine `List<String>`.
- **Option B is correct:** `List<?>` (ungebunden) akzeptiert Listen jedes Typs, einschließlich `List<String>`.
- **Option C is correct (with warnings):** Die Verwendung des Raw-Types `List` schaltet die generische Typprüfung ab und akzeptiert jedes `List`-Objekt.
- **Option D fails:** `List<? super Object>` akzeptiert nur Listen von Typen, die Supertypen von `Object` sind (also nur `List<Object>`).

---

### Frage 18
Was ist das Ergebnis des Kompilierens der folgenden Klasse?
```java
public class Box<T> {
    private T t;
    public Box(T t) { this.t = t; }
    
    public <U extends T> void inspect(U u) {
        System.out.println(u.getClass().getName());
    }
}
```
- A. Die Kompilierung schlägt fehl, da `U extends T` eine ungültige Syntax ist.
- B. Die Kompilierung schlägt fehl, da ein Klassen-Typparameter `T` nicht als Schranke für einen anderen Typparameter `U` verwendet werden kann.
- C. Kompiliert erfolgreich.
- D. Kompiliert erfolgreich, wirft jedoch eine Exception, wenn `T` als Interface initialisiert wird.

**Answer: C**
**Explanation (German/English):**
- **Type Parameter as Bound:** Es ist in Java vollkommen legal, einen Typparameter (`T`) als obere Schranke für einen anderen Typparameter (`U`) zu verwenden (z. B. `<U extends T>`).
- Dies stellt sicher, dass der Typ `U` zur Laufzeit ein Subtyp des Typs `T` der Instanz sein muss. Der Code kompiliert fehlerfrei.

---

### Frage 19
Welche der folgenden Aussagen zur Kompilierzeit treffen auf Raw-Types in Java zu?
- A. Raw-Types werden nur zur Abwärtskompatibilität mit Code vor Java 5 bereitgestellt.
- B. Der Compiler führt keine Typprüfung durch und gibt keine Warnungen aus, wenn Raw-Types verwendet werden.
- C. Raw-Types umgehen die Typensicherheitsprüfungen zur Kompilierzeit.
- D. Sowohl A als auch C sind korrekt.

**Answer: D**
**Explanation (German/English):**
- **Raw Types:** Raw-Types (die Nutzung einer generischen Klasse ohne Typparameter, z. B. `List list = new ArrayList()`) wurden ausschließlich zur Abwärtskompatibilität mit Code vor Java 5 eingeführt.
- Bei der Verwendung von Raw-Types verzichtet der Compiler auf die Typprüfung für generische Operationen und gibt ist stattdessen Warnungen aus ("unchecked warnings"). Dadurch wird die compile-zeitliche Typensicherheit umgangen.

---

### Frage 20
Was ist das Ergebnis des Versuchs, den folgenden Code unter Java 21 zu kompilieren und auszuführen?
```java
public class RecordPatternTest {
    record Pair<T>(T first, T second) {}
    
    public static void main(String[] args) {
        Object obj = new Pair<>("A", "B");
        if (obj instanceof Pair<String>(var f, var s)) {
            System.out.println(f.toLowerCase() + " " + s.toLowerCase());
        }
    }
}
```
- A. Kompiliert erfolgreich und gibt `a b` aus.
- B. Die Kompilierung schlägt fehl, da Record-Patterns nicht generisch sein können.
- C. Die Kompilierung schlägt fehl, da Pattern-Matching nicht mit var verwendet werden kann.
- D. Wirft eine ClassCastException zur Laufzeit.

**Answer: A**
**Explanation (German/English):**
- **Java 21 Generic Record Patterns:** Seit Java 21 sind Record-Patterns voll integriert.
- Wenn das Objekt gegen ein generisches Record-Pattern geprüft wird (z. B. `Pair<String>(var f, var s)`), ermittelt der Compiler den Typ der Variablen `f` und `s` als `String` durch Typinferenz.
- Da `f` und `s` als `String` inferiert werden, ist der Aufruf von `toLowerCase()` auf diesen Variablen vollkommen legal und kompiliert fehlerfrei. Die Ausführung gibt `a b` aus.
