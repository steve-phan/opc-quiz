# Chapter 11: Generics & Type Erasure

## 1. Core Java 21 Exam Objectives
- Create and use generic classes, interfaces, and methods.
- Master wildcards: unbound (`?`), upper-bounded (`? extends T`), and lower-bounded (`? super T`).
- Apply the PECS (Producer Extends, Consumer Super) rule.
- Explain JVM Type Erasure and compiler-generated bridge methods.

---

## 2. Deep-Dive Concepts

### Wildcards: Upper-Bounded vs. Lower-Bounded
Wildcards are used to specify restrictions on generic type arguments, enabling polymorphism in generics.

#### 1. Upper-Bounded Wildcard (`? extends T`)
- Restricts the type to be a subclass of `T` (or `T` itself).
- **Read-Only:** You can safely *read* items from the collection as type `T`, but you **cannot write** (add) anything to the collection (except `null`), because the compiler cannot guarantee the exact subclass type at runtime.

#### 2. Lower-Bounded Wildcard (`? super T`)
- Restricts the type to be a superclass of `T` (or `T` itself).
- **Write-Safe:** You can safely *write* (add) items of type `T` (or subclasses of `T`) to the collection. However, reading from the collection only returns type `Object`, because the compiler cannot guarantee which superclass type is being read.

#### The PECS Rule:
- **P**roducer **E**xtends: If your generic structure produces data (you only read from it), use `? extends T`.
- **C**onsumer **S**uper: If your generic structure consumes data (you write into it), use `? super T`.

```java
// Producer: Read elements
public void printBooks(List<? extends Book> books) {
    for (Book b : books) { // Valid: reading as Book
        System.out.println(b.getTitle());
    }
    // books.add(new Book("Java", 10)); // Compile error! Cannot write.
}

// Consumer: Write elements
public void addBooks(List<? super Book> books) {
    books.add(new Book("Java OCP 21", 50.0)); // Valid: writing Book
    // Object obj = books.get(0); // Only returns Object, cannot read as Book.
}
```

---

## 3. JVM Internals & Memory Layout

### Type Erasure
Java generics were introduced in Java 5 and designed to maintain backward compatibility. Under **Type Erasure**, the compiler removes all generic type information during compilation.
1. The compiler replaces type parameters with their first bound (usually `Object`, or the class specified in `extends`).
2. The compiler inserts explicit casts where necessary when retrieving values.
3. Because of type erasure, generic type arguments are **not available at runtime**. Writing `if (list instanceof List<String>)` or `new T()` is a compile-time error.

```
+-------------------------------------------------------------+
| JVM TYPE ERASURE PROCESS                                    |
|                                                             |
| Source Code (Compile Time):                                 |
| class Box<T extends Book> {                                 |
|     private T content;                                      |
|     public T get() { return content; }                      |
| }                                                           |
|                                                             |
| Compiled Bytecode (Runtime):                                |
| class Box {                                                 |
|     private Book content; // T replaced by bound Book       |
|     public Book get() { return content; }                   |
| }                                                           |
+-------------------------------------------------------------+
```

### Compiler-Generated Bridge Methods
To preserve polymorphic behavior in classes extending parameterized classes, the compiler automatically generates synthetic **bridge methods**.
Consider:
```java
class Node<T> {
    public void set(T value) {}
}
class IntNode extends Node<Integer> {
    public void set(Integer value) {}
}
```
After type erasure, `Node` has method `set(Object)`. But `IntNode` has method `set(Integer)`. Because the signatures differ, `IntNode` would no longer override `Node.set()`, breaking polymorphism.
To fix this, the compiler generates a bridge method in `IntNode`:
```java
public void set(Object value) {
    this.set((Integer) value); // Casts and delegates
}
```

---

## 4. Tricky OCP Exam Questions

### Question 1
What is the result of attempting to compile and run the following class?
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
- A. Compiles successfully.
- B. Compilation fails only at the declaration of `defaultValue`.
- C. Compilation fails only at the declaration of `getDefaultValue()`.
- D. Compilation fails at both `defaultValue` and `getDefaultValue()`.

**Answer: D**
**Explanation (German/English):**
- **Static Context with Generics:** Statische Variablen und Methoden gehören zur Klasse selbst und werden zwischen allen Instanzen geteilt.
- Da der Typparameter `T` an die Instanziierung der Klasse gebunden ist (z. B. `new Container<String>()`), existiert `T` im statischen Kontext nicht.
- Statische Felder (`defaultValue`) dürfen den Typparameter `T` der Klasse nicht verwenden.
- Statische Methoden (`getDefaultValue()`) dürfen `T` ebenfalls nicht als Rückgabe- oder Parametertyp verwenden, es sei denn, sie deklarieren einen eigenen Typparameter (wie in `getSpecified()`, wo `<U>` eine eigenständige statische Deklaration ist). Daher schlägt die Kompilierung an beiden Stellen fehl.

---

### Question 2
What is the outcome of compiling the following code segment?
```java
import java.util.List;

public class OverloadTest {
    public void process(List<String> list) {}
    public void process(List<Integer> list) {}
}
```
- A. Compiles successfully; both methods are overloaded.
- B. Compile-time error because of type erasure.
- C. Compiles successfully, but throws a runtime warning.
- D. Compilation fails because `List` is a raw type.

**Answer: B**
**Explanation (German/English):**
- **Type Erasure Overload Conflict:** Durch den Prozess der Type Erasure (Typ-Löschung) ersetzt der Compiler alle Typparameter durch ihre Schranken (hier `Object`).
- Nach der Übersetzung besitzen beide Methoden die identische Signatur `process(List list)` im Bytecode.
- Da Java keine zwei Methoden mit derselben gelöschten Signatur in derselben Klasse zulässt, meldet der Compiler einen Fehler ("both methods have same erasure").

---

### Question 3
Which of the following statements compile successfully? (Choose all that apply)
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

### Question 4
Which of the following array declarations compile without error? (Choose all that apply)
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

### Question 5
Consider the following class hierarchy:
```java
class Vehicle {}
class Car extends Vehicle {}
class SportsCar extends Car {}
```
Given the declaration:
```java
List<? super Car> list = new ArrayList<Vehicle>();
```
Which of the following lines will compile? (Choose all that apply)
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

### Question 6
Using the same class hierarchy:
```java
class Vehicle {}
class Car extends Vehicle {}
class SportsCar extends Car {}
```
Given the declaration:
```java
List<? extends Car> list = new ArrayList<SportsCar>();
```
Which of the following lines compile? (Choose all that apply)
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

### Question 7
Consider the following attempt to swap the elements in a wildcard list:
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
What is the result of compiling this class?
- A. Compiles successfully.
- B. Compile-time error on Line A and Line B due to wildcard capture failure.
- C. Compiles successfully if we change `List<?>` to `List<Object>`.
- D. Both B and C are correct.

**Answer: D**
**Explanation (German/English):**
- **Wildcard Capture Error:** Der Compiler kann ein Element nicht in eine Liste schreiben, deren Typ als `?` (ungebunden) deklariert ist. Der Typ `?` repräsentiert einen unbekannten spezifischen Typ (z. B. `List<String>`). Wenn wir versuchen, ein `Object` hineinzuschreiben, verweigert der Compiler dies, um die Typensicherheit zu garantieren.
- Dies nennt man ein **Capture-Problem**.
- Wenn wir den Typ zu `List<Object>` ändern, weiß der Compiler, dass die Liste explizit für `Object` deklariert ist und erlaubt Schreibzugriffe mit beliebigen Objekten (C ist korrekt). Alternativ kann dieses Problem durch eine private Hilfsmethode gelöst werden: `private static <T> void swapHelper(List<T> list)`.

---

### Question 8
Consider this method declaration:
```java
public static <T extends Comparable<? super T>> T max(List<? extends T> list)
```
Why is the recursive bound specified as `Comparable<? super T>` instead of `Comparable<T>`?
- A. It has no functional difference; both compile identically.
- B. It allows class types that inherit `Comparable` from a superclass to be used.
- C. It allows checking compatibility of types at runtime via reflection.
- D. It prevents ClassCastException at runtime.

**Answer: B**
**Explanation (German/English):**
- **Recursive Generic Bounds:**
  - Angenommen, wir haben eine Klasse `Parent implements Comparable<Parent>` und eine Unterklasse `Child extends Parent`.
  - Da `Child` kein `Comparable<Child>` implementiert, sondern das `Comparable<Parent>` von seiner Elternklasse erbt, würde ein Typ `T` als `Child` mit der Bedingung `<T extends Comparable<T>>` die Schranke verletzen und einen Compilerfehler erzeugen.
  - Die Schranke `Comparable<? super T>` erlaubt es, dass die Klasse `Comparable` für einen Supertyp von `T` implementiert ist (in diesem Fall `Parent`, welches ein Supertyp von `Child` ist). Dies erhöht die Wiederverwendbarkeit von generischen Algorithmen erheblich.

---

### Question 9
What is the behavior of the following code program?
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
- A. Compilation fails.
- B. Prints `Success: 10`
- C. Prints `ClassCastException`
- D. Throws ClassCastException during `rawList.add(10)`.

**Answer: C**
**Explanation (German/English):**
- **Heap Pollution:**
  - Der Code kompiliert mit Warnungen ("unchecked warning"), da wir generische Typen mit Raw-Types mischen.
  - Das Hinzufügen von `10` (Integer) in `rawList` gelingt zur Laufzeit, da durch Type Erasure die Liste intern als einfaches `ArrayList` (für `Object`) vorliegt.
  - Die Zuweisung `List<String> strList = rawList` gelingt ebenfalls ohne Exception zur Laufzeit, da Typinformationen gelöscht sind.
  - Die `ClassCastException` wird erst in der Zeile `String s = strList.get(0);` geworfen. Hier fügt der Compiler einen impliziten Cast `(String)` ein, da `strList` als `List<String>` deklariert ist. Da das zurückgegebene Objekt jedoch ein `Integer` ist, schlägt dieser Cast fehl.

---

### Question 10
Which of the following assignments will compile without error or warning?
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

### Question 11
Given the following code block:
```java
public class MyNode<T extends Number> {
    private T data;
    public MyNode(T data) { this.data = data; }
    public void setData(T data) { this.data = data; }
}
```
What is the signature of `setData` in the compiled `.class` file after Type Erasure?
- A. `public void setData(Object data)`
- B. `public void setData(Number data)`
- C. `public void setData(T data)`
- D. The method is deleted.

**Answer: B**
**Explanation (German/English):**
- **Erasure to Bound:** Wenn ein Typparameter eine obere Schranke besitzt (z. B. `<T extends Number>`), ersetzt der Compiler den Typparameter `T` durch die erste obere Schranke (`Number`).
- Wenn keine Schranke angegeben ist (z. B. `<T>`), wird sie durch `Object` ersetzt.
- Daher wird `setData(T)` zu `setData(Number)`.

---

### Question 12
Which of the following statements is true regarding JVM Bridge Methods?
- A. They are written manually by developers to support backward compatibility.
- B. They are generated by the compiler at compile time to preserve polymorphic behavior.
- C. They bypass Type Erasure at runtime.
- D. They prevent heap pollution.

**Answer: B**
**Explanation (German/English):**
- **Bridge Methods (Brückenmethoden):** Da Java-Generics zur Laufzeit gelöscht werden, können Vererbungsszenarien entstehen, in denen Signaturen nicht mehr übereinstimmen (z. B. eine Unterklasse überschreibt eine Methode mit einem spezifischeren Typen als die gelöschte Superklasse).
- Um Polymorphie und dynamischen Dispatch aufrechtzuerhalten, generiert der Java-Compiler synthetische Brückenmethoden im Bytecode der Unterklasse, die die gelöschte Signatur der Superklasse implementieren und den Aufruf (mit Cast) an die spezifische Methode delegieren.

---

### Question 13
Consider the following generic class implementation:
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
Which lines in this class cause compilation errors?
- A. Only Line 1
- B. Only Line 1 and Line 2
- C. Only Line 2 and Line 3
- D. Line 1, Line 2, and Line 3

**Answer: D**
**Explanation (German/English):**
- **Generics Restrictions:** Aufgrund von Type Erasure sind Typparameter (`T`) zur Laufzeit nicht physisch präsent. Daher gelten folgende Einschränkungen:
  - `new T()` (Line 1) ist illegal, da der Compiler nicht weiß, welcher Konstruktor aufgerufen werden soll und der Typ zur Laufzeit nicht bekannt ist.
  - `new T[5]` (Line 2) ist illegal, da Arrays ihren Komponententyp zur Laufzeit kennen müssen (Reifizierbarkeit).
  - `instanceof T` (Line 3) ist illegal, da die JVM den gelöschten Typen zur Laufzeit nicht überprüfen kann.

---

### Question 14
What is the result of attempting to compile the following code?
```java
public class MultiBound<T extends Runnable & Cloneable> {
    private T entity;
    
    public void start() {
        entity.run();
    }
}
```
- A. Compilation fails because a type parameter can only have one bound.
- B. Compilation fails because interfaces cannot be used as bounds.
- C. Compiles successfully.
- D. Compilation fails because the bounds must be separated by commas instead of ampersands.

**Answer: C**
**Explanation (German/English):**
- **Multiple Bounds:** Java erlaubt es, einem Typparameter mehrere Schranken (Multiple Bounds) zuzuweisen.
- Die Syntax dafür verwendet das Kaufmanns-Und-Zeichen (`&`), z. B. `<T extends A & B & C>`.
- **Regel:** Wenn eine der Schranken eine konkrete Klasse ist, muss diese als erstes deklariert werden. Da hier jedoch beide Schranken Interfaces sind (`Runnable` und `Cloneable`), ist die Reihenfolge beliebig und der Code kompiliert einwandfrei.

---

### Question 15
What is the output of compiling and running the following code?
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
- C. Compilation fails because class types cannot be compared with `==`.
- D. Throws ClassCastException at runtime.

**Answer: A**
**Explanation (German/English):**
- **Single Runtime Class Representing Generics:** Durch die Typ-Löschung (Type Erasure) existieren die generischen Typparameter `<String>` und `<Integer>` zur Laufzeit nicht.
- Beide Instanzen werden zur Laufzeit durch dieselbe Klasse `java.util.ArrayList` repräsentiert.
- Der Aufruf von `getClass()` liefert für beide Objekte das Klassenobjekt von `ArrayList`. Daher gibt der Vergleich `==` den Wert `true` zurück.

---

### Question 16
What is the result of attempting to compile and run the following code?
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
- A. Compiles successfully.
- B. Compilation fails at Line 1.
- C. Throws `ClassCastException` at runtime.
- D. Throws `UnsupportedOperationException` at runtime.

**Answer: B**
**Explanation (German/English):**
- **Wildcard Compatibility:**
  - `list1` ist als `List<? extends Number>` deklariert. Dies kann eine Liste von beliebigen Unterklassen von `Number` sein (z. B. `List<Double>`).
  - `list2` ist als `List<? super Integer>` deklariert. Dies verlangt eine Liste eines Typs, der ein Supertyp von `Integer` ist (z. B. `List<Integer>`, `List<Number>`, `List<Object>`).
  - Der Compiler verhindert die Zuweisung in Line 1, da `list1` beispielsweise eine `List<Double>` referenzieren könnte. Eine `List<Double>` ist jedoch nicht mit `List<? super Integer>` kompatibel (da `Double` kein Supertyp von `Integer` ist). Daher schlägt die Kompilierung fehl.

---

### Question 17
Given the following code structure:
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
Which of the following alternatives for the parameter type of `printElements` would allow the program to compile and run identically? (Choose all that apply)
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

### Question 18
What is the result of compiling the following class?
```java
public class Box<T> {
    private T t;
    public Box(T t) { this.t = t; }
    
    public <U extends T> void inspect(U u) {
        System.out.println(u.getClass().getName());
    }
}
```
- A. Compilation fails because `U extends T` is invalid syntax.
- B. Compilation fails because a class type parameter `T` cannot be used as a bound for another type parameter `U`.
- C. Compiles successfully.
- D. Compiles successfully, but throws an exception if `T` is initialized as an interface.

**Answer: C**
**Explanation (German/English):**
- **Type Parameter as Bound:** Es ist in Java vollkommen legal, einen Typparameter (`T`) als obere Schranke für einen anderen Typparameter (`U`) zu verwenden (z. B. `<U extends T>`).
- Dies stellt sicher, dass der Typ `U` zur Laufzeit ein Subtyp des Typs `T` der Instanz sein muss. Der Code kompiliert fehlerfrei.

---

### Question 19
Which of the following compile-time statements are true about raw types in Java?
- A. Raw types are only provided for backward compatibility with pre-Java 5 code.
- B. The compiler does not perform type checking or emit warnings when using raw types.
- C. Raw types bypass compile-time type-safety checks.
- D. Both A and C are correct.

**Answer: D**
**Explanation (German/English):**
- **Raw Types:** Raw-Types (die Nutzung einer generischen Klasse ohne Typparameter, z. B. `List list = new ArrayList()`) wurden ausschließlich zur Abwärtskompatibilität mit Code vor Java 5 eingeführt.
- Bei der Verwendung von Raw-Types verzichtet der Compiler auf die Typprüfung für generische Operationen und gibt stattdessen Warnungen aus ("unchecked warnings"). Dadurch wird die compile-zeitliche Typensicherheit umgangen.

---

### Question 20
What is the result of attempting to compile and run the following code under Java 21?
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
- A. Compiles successfully and prints `a b`.
- B. Compilation fails because record patterns cannot be generic.
- C. Compilation fails because pattern matching cannot be used with var.
- D. Throws ClassCastException at runtime.

**Answer: A**
**Explanation (German/English):**
- **Java 21 Generic Record Patterns:** Seit Java 21 sind Record-Patterns voll integriert.
- Wenn das Objekt gegen ein generisches Record-Pattern geprüft wird (z. B. `Pair<String>(var f, var s)`), ermittelt der Compiler den Typ der Variablen `f` und `s` als `String` durch Typinferenz.
- Da `f` und `s` als `String` inferiert werden, ist der Aufruf von `toLowerCase()` auf diesen Variablen vollkommen legal und kompiliert fehlerfrei. Die Ausführung gibt `a b` aus.

