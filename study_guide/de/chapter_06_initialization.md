# Kapitel 6: Klassendesign, Konstruktoren & Initialisierungsreihenfolge

## 1. Core Java 21 Prüfungsziele
- Klassendesign, Methoden und Zugriffsmodifizierer verstehen.
- Die JVM-Klasseninitialisierungs- und Instanziierungsreihenfolge beherrschen.
- Konstruktor-Überladung (Constructor Overloading) und Konstruktor-Verkettung (Constructor Chaining) mittels `this()` und `super()` implementieren.
- Garbage Collection (GC) Roots und die Kriterien zur GC-Berechtigung von Objekten identifizieren.

---

## 2. Detaillierte Konzepte

### Regeln zur Konstruktor-Verkettung (Constructor Chaining)
- **Die Regel der ersten Zeile:** Die erste Anweisung eines Konstruktors muss ein Aufruf eines anderen Konstruktors derselben Klasse (`this(...)`) oder des übergeordneten Konstruktors der Elternklasse (`super(...)`) sein.
- **Standardkonstruktor (Default Constructor):** Wenn Sie keinen Konstruktor schreiben, fügt der Compiler automatisch einen parameterlosen Standardkonstruktor ein, der lediglich `super();` aufruft. Wenn Sie hingegen *irgendeinen* Konstruktor selbst definieren, wird der Standardkonstruktor nicht generiert.
- **Implizites `super()`:** Wenn Sie in der ersten Zeile keinen expliziten Aufruf von `this(...)` oder `super(...)` angeben, fügt der Compiler automatisch einen impliziten Aufruf von `super();` ein.
- *OCP-Falle:* Wenn die Elternklasse Konstruktoren definiert, aber *keinen* parameterlosen Konstruktor besitzt, müssen alle Konstruktoren der Unterklasse explizit einen gültigen Elternkonstruktor mittels `super(args);` aufrufen. Geschieht dies nicht, schlägt die Kompilierung der Unterklasse fehl!

### Die genaue Reihenfolge der JVM-Initialisierung
Beim Laden einer Klasse und der Erstellung einer Instanz führt die JVM die Blöcke in einer strengen Sequenz aus:

#### Schritt 1: Statische Initialisierung (Wird einmalig beim ersten Laden der Klasse ausgeführt)
1. **Statische Felder und statische Blöcke:** Diese werden in der Reihenfolge ausgewertet und ausgeführt, in der sie im Quellcode erscheinen.

#### Schritt 2: Instanz-Initialisierung (Wird bei jeder Erstellung eines neuen Objekts ausgeführt)
2. **Instanzinitialisierung der Superklasse:** Führt zuerst die Instanzinitialisierungsblöcke und den Konstruktor der Elternklasse aus.
3. **Instanzfelder und Instanzblöcke der Unterklasse:** Diese werden in der Reihenfolge ausgewertet und ausgeführt, in der sie im Quellcode der Unterklasse erscheinen.
4. **Konstruktor der Unterklasse:** Die verbleibenden Zeilen des Konstruktorrumpfs der Unterklasse werden ausgeführt.

---

## 3. JVM-Interna & Speicherlayout

### Bytecode-Sicht: `<clinit>` vs. `<init>`
Der JVM-Compiler fasst Initialisierungscode in zwei speziellen internen Methoden zusammen:
1. **`<clinit>` (Class Initializer):** Enthält alle Zuweisungen statischer Felder sowie alle statischen Initialisierungsblöcke. Die JVM führt `<clinit>` automatisch aus, wenn die Klasse das erste Mal geladen wird (ausgelöst durch den Zugriff auf ein statisches Mitglied oder den Aufruf von `new`).
2. **`<init>` (Instance Initializer):** Enthält alle Zuweisungen von Instanzfeldern, Instanzinitialisierungsblöcke und den Code des Konstruktors. Der Compiler generiert für jeden Konstruktor in der Klasse eine eigene `<init>`-Methode.

```
+-------------------------------------------------------+
| JVM INITIALIZATION ENGINE                             |
|                                                       |
| 1. Klasse laden -> <clinit> ausführen                 |
|    - Statische Felder (in Reihenfolge)                |
|    - Statische Blöcke (in Reihenfolge)                |
|                                                       |
| 2. Instanz erstellen -> <init> ausführen              |
|    - Superklasse <init> aufrufen (super()-Verkettung) |
|    - Instanzfelder & -blöcke der Unterklasse (Reih.)  |
|    - Konstruktorrumpf der Unterklasse                 |
+-------------------------------------------------------+
```

### GC-Berechtigung (Garbage Collection Eligibility) & GC Roots
Ein Objekt auf dem Heap ist für die Garbage Collection berechtigt, sobald es von keinem **GC Root** mehr erreichbar ist.
Ein **GC Root** is eine Referenzquelle, von der garantiert wird, dass sie aktiv (lebendig) ist:
1. **Lokale Variablen:** Referenzen in aktiven Stackframes von Threads.
2. **Statische Variablen:** Referenzen in geladenen Klassen im Metaspace.
3. **JNI (Java Native Interface):** Referenzen in nativem C/C++-Code.

```
+-------------------------------------------------------------+
| JVM-SPEICHER & GC ROOTS                                     |
|                                                             |
|   [ Stack-Frame (GC Root) ]                                 |
|   - Lokale Ref `book` ---------------> [ Buch-Objekt A ]     |
|                                         (Erreichbar - Behalten)|
|                                                             |
|                                       [ Buch-Objekt B ]     |
|                                         (Unerreichbar!      |
|                                          Bereit für GC)     |
+-------------------------------------------------------------+
```
*OCP-Falle:* Das Setzen einer Referenz auf `null` ist eine gängige Methode, um ein Objekt für die GC bereit zustellen. Es geht jedoch grundlegend um die Erreichbarkeit. Wenn ein Objekt auf andere Objekte verweist, können diese *alle* für die GC freigegeben werden, wenn die gesamte Insel von Objekten von jedem aktiven GC Root getrennt wird (dies nennt man eine **Island of Isolation** / Isolationsinsel).

---

## 4. Knifflige OCP-Prüfungsfragen

### Frage 1: Fortgeschrittene Reihenfolge der Klasseninitialisierung
Was ist die Ausgabe bei der Ausführung des folgenden Programms?
```java
class Base {
    static { System.out.print("A "); }
    { System.out.print("B "); }
    Base() { System.out.print("C "); }
}

class Derived extends Base {
    static { System.out.print("D "); }
    { System.out.print("E "); }
    Derived() {
        this(10);
        System.out.print("F ");
    }
    Derived(int x) {
        super();
        System.out.print("G ");
    }
}

public class InitFlow {
    public static void main(String[] args) {
        System.out.print("Start ");
        new Derived();
    }
}
```
- A. `Start A D B C E G F`
- B. `A D Start B C E G F`
- C. `Start A D B C E F G`
- D. `A D Start B C E F G`

**Antwort: A**
**Detaillierte Erklärung:**
- Wenn die JVM startet, lädt sie die Hauptklasse `InitFlow`.
- Die erste Anweisung in `main` ist `System.out.print("Start ");`, welche ausgeführt wird und `"Start "` ausgibt.
- Als Nächstes wird `new Derived()` aufgerufen. Dies löst das Laden der Klasse `Derived` aus.
- Da `Derived` von `Base` erbt, lädt die JVM zuerst die Superklasse `Base` und führt deren statische Initialisierer aus. Dies gibt `"A "` aus.
- Die JVM lädt dann die Unterklasse `Derived` und führt deren statische Initialisierer aus. Dies gibt `"D "` aus.
- Nun ist das Laden der Klasse abgeschlossen und die Instanziierung beginnt:
  - Der Standardkonstruktor `Derived()` wird aufgerufen.
  - Die erste Anweisung ist `this(10);`, was an den überladenen Konstruktor `Derived(int x)` weiterleitet.
  - In `Derived(int x)` lautet die erste Anweisung `super();` (wodurch explizit der `Base`-Konstruktor aufgerufen wird).
  - Dadurch wird die Ausführung an die Instanzinitialisierung der Superklasse `Base` übergeben.
  - Die Instanzinitialisierer von `Base` werden zuerst ausgeführt und geben `"B "` aus.
  - Der Konstruktorrumpf von `Base` wird als Nächstes ausgeführt und gibt `"C "` aus.
  - Die Kontrolle kehrt zur Instanzinitialisierung von `Derived` zurück.
  - Die Instanzinitialisierer der Unterklasse (`{ System.out.print("E "); }`) werden ausgeführt und geben `"E "` aus.
  - Der Rumpf von `Derived(int x)` wird abgeschlossen und gibt `"G "` aus.
  - Die Kontrolle kehrt zu `Derived()` zurück, welcher seinen Rumpf abschließt und `"F "` ausgibt.
- Ausgabe: `Start A D B C E G F`.

---

### Frage 2: Polymorphie in Konstruktoren (Polymorphie-Falle)
Was ist die Ausgabe bei der Ausführung des folgenden Codes?
```java
class Alpha {
    Alpha() {
        printName();
    }
    void printName() {
        System.out.print("Alpha ");
    }
}

class Beta extends Alpha {
    private String name = "Beta";
    
    @Override
    void printName() {
        System.out.print(name + " ");
    }
}

public class PolyConstructor {
    public static void main(String[] args) {
        new Beta();
    }
}
```
- A. `Alpha`
- B. `Beta`
- C. `null`
- D. Der Code kompiliert aufgrund von Überschreibungsregeln (Override Rules) nicht.

**Antwort: C**
**Detaillierte Erklärung:**
- Dies ist eine klassische und sehr knifflige OCP-Prüfungsfrage, die die Gefahr des Aufrufs überschreibbarer Methoden in Konstruktoren demonstriert.
- **Schritt 1:** `new Beta()` wird aufgerufen. Der `Beta`-Konstruktor ruft implizit den Elternkonstruktor `super()` auf.
- **Schritt 2:** Im `Alpha`-Konstruktor wird die Methode `printName()` aufgerufen.
- **Schritt 3:** Da Methodenaufrufe in Java **polymorph** sind (aufgelöst über virtuelle Methodenaufrufe basierend auf dem tatsächlichen Laufzeittyp des Objekts), führt die JVM die überschriebene Methode `printName()` in der Unterklasse `Beta` aus.
- **Schritt 4:** Zu diesem Zeitpunkt sind die Instanzfelder von `Beta` (speziell `name = "Beta"`) **noch nicht initialisiert**. Instanzvariablen einer Unterklasse werden erst initialisiert, *nachdem* der Konstruktor der Superklasse abgeschlossen ist.
- Daher enthält die Instanzvariable `name` immer noch ihren Standardinitialisierungswert, der `null` ist.
- Die Methode `printName()` der Unterklasse führt `System.out.print(name + " ");` aus und gibt `"null "` aus.
- **Schritt 5:** Nachdem der `Alpha`-Konstruktor abgeschlossen ist, initialisiert die JVM `name` mit `"Beta"`, aber das ist zu spät, um die Ausgabe des Konstruktors zu beeinflussen.
- Ausgabe: `null `.

---

### Frage 3: Uninitialisierte finale Variablen (Blank Final) in Konstruktoren
Welche der folgenden Konstruktorstrukturen wird nicht kompiliert?
```java
// Option I
class FinalVar1 {
    private final int value;
    public FinalVar1() {
        value = 10;
    }
}

// Option II
class FinalVar2 {
    private final int value;
    public FinalVar2() {
        this(5);
    }
    public FinalVar2(int val) {
        value = val;
    }
}

// Option III
class FinalVar3 {
    private final int value;
    { value = 10; }
    public FinalVar3() {
        // empty
    }
}

// Option IV
class FinalVar4 {
    private final int value;
    public FinalVar4() {
        // empty
    }
    public FinalVar4(int val) {
        value = val;
    }
}
```
- A. Nur Option IV
- B. Nur Option I und IV
- C. Nur Option II und III
- D. Keine; alle Optionen kompilieren erfolgreich.

**Antwort: A**
**Detaillierte Erklärung:**
- Wenn ein Instanzfeld als `final` deklariert ist, muss es bis zum Abschluss des Instanzerstellungsprozesses genau einmal initialisiert werden.
- Es kann wie folgt initialisiert werden:
  - Bei der Deklaration (z. B. `private final int value = 10;`).
  - In einem Instanzinitialisierungsblock (Option III).
  - In **jedem** Konstruktor der Klasse (Option I).
- In Option II delegiert `FinalVar2()` an `FinalVar2(int)`, welcher `value` initialisiert. Dies ist gültig.
- In **Option IV** initialisiert der parameterlose Konstruktor `FinalVar4()` die Variable `value` **nicht** (und delegiert auch nicht an einen anderen Konstruktor). Da es einen Konstruktorpfad gibt, bei dem das uninitialisierte finale Feld uninitialisiert bleibt, wirft der Compiler einen Fehler: `variable value might not have been initialized`.

---

### Frage 4: Isolationsinseln (Islands of Isolation - GC-Berechtigung)
Betrachten Sie das folgende Programm:
```java
public class GCIsland {
    GCIsland partner;

    public static void main(String[] args) {
        GCIsland a = new GCIsland(); // Object 1
        GCIsland b = new GCIsland(); // Object 2
        
        a.partner = b;
        b.partner = a;
        
        a = null;
        b = null;
        // Line 11
    }
}
```
Wie viele Objekte sind in Zeile 11 für die Garbage Collection berechtigt?
- A. 0
- B. 1
- C. 2
- D. Sie sind erst berechtigt, wenn die JVM heruntergefahren wird, da sie sich gegenseitig referenzieren.

**Antwort: C**
**Detaillierte Erklärung:**
- Wenn `a = null` und `b = null` ausgeführt werden, halten die lokalen Variablen im Stack-Frame keine Referenzen mehr auf Objekt 1 oder Objekt 2.
- Obwohl sich Objekt 1 und Objekt 2 gegenseitig referenzieren (was eine zirkuläre Abhängigkeit oder eine "Isolationsinsel" / "Island of Isolation" bildet), sind sie von keinem **GC Root** (wie Stack-Frames, statische Felder usw.) mehr erreichbar.
- Da sie von aktiven Programm-Roots aus unerreichbar sind, kann der Garbage Collector sie als tote Objekte identifizieren und freigeben.
- Daher sind beide Objekte (2) für die Garbage Collection berechtigt.

---

### Frage 5: Privater Konstruktor und Vererbung
Was ist das Kompilierungsergebnis des folgenden Codes?
```java
class Base {
    private Base() {}
}

class Sub extends Base {
    public Sub() {
        super();
    }
}
```
- A. Kompiliert erfolgreich.
- B. Kompiliert nicht, da `Sub` nicht auf den privaten Konstruktor von `Base` zugreifen kann.
- C. Kompiliert nicht, da `Base` als `abstract` deklariert sein muss.
- D. Kompiliert, wirft aber zur Laufzeit einen `IllegalAccessError`.

**Antwort: B**
**Detaillierte Erklärung:**
- Konstruktoren werden nicht vererbt, aber der Unterklassenkonstruktor muss immer einen Elternkonstruktor aufrufen (entweder implizit oder explizit).
- Der Konstruktor der Klasse `Base` ist als `private` deklariert. Dies beschränkt seine Sichtbarkeit ausschließlich auf die Klasse `Base` selbst.
- Der Unterklassenkonstruktor `Sub()` ruft `super();` auf, was versucht, auf den privaten Konstruktor der Elternklasse zuzugreifen.
- Da dieser nicht zugänglich ist, schlägt die Kompilierung mit dem Fehler fehl: `Base() has private access in Base`.
- *(Hinweis: Das Deklarieren von ausschließlich privaten Konstruktoren in einer Klasse verhindert effektiv, dass sie erweitert werden kann).*

---

### Frage 6: Verdecken von Feldern (Nicht-polymorphe Felder)
Was ist die Ausgabe des folgenden Programms?
```java
class Parent {
    public int x = 10;
    public void print() {
        System.out.print(x + " ");
    }
}

class Child extends Parent {
    public int x = 20;
    @Override
    public void print() {
        System.out.print(x + " ");
    }
}

public class FieldHiding {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.print(p.x + " ");
        p.print();
    }
}
```
- A. `10 10 `
- B. `20 20 `
- C. `10 20 `
- D. `20 10 `

**Antwort: C**
**Detaillierte Erklärung:**
- In Java gilt **Polymorphie nur für Instanzmethoden, nicht für Instanzvariablen**.
- Wenn eine Unterklasse eine Instanzvariable mit demselben Namen wie eine Variable in der Superklasse definiert, **verdeckt** (hides) die Variable der Unterklasse die der Elternklasse.
- Auf welche Variable zugegriffen wird, hängt vom **deklarierten Referenztyp** zur Kompilierzeit ab, nicht vom tatsächlichen Laufzeittyp des Objekts.
- `Parent p = new Child();` deklariert eine Referenz `p` des Typs `Parent`.
- Daher greift `p.x` auf die in der Klasse `Parent` definierte Variable `x` zu, was `10` ergibt.
- Der Aufruf von `p.print()` führt jedoch die überschriebene Methode `print()` in `Child` aus, da die Methodenauflösung polymorph ist.
- Innerhalb von `Child.print()`, `x` bezieht sich die Variable auf die in `Child` definierte, was `20` ergibt.
- Kombinierte Ausgabe: `10 20 `.

---

### Frage 7: Auflösung von Konstruktor-Überladung
Gegeben seien die folgenden überladenen Konstruktoren:
```java
public class MatchTest {
    public MatchTest(double d) { System.out.print("double "); }
    public MatchTest(Integer i) { System.out.print("Integer "); }
    public MatchTest(int... x) { System.out.print("varargs "); }

    public static void main(String[] args) {
        new MatchTest(5);
    }
}
```
Was wird ausgegeben?
- A. `Integer `
- B. `double `
- C. `varargs `
- D. Kompiliert nicht aufgrund einer mehrdeutigen Konstruktorauswahl.

**Antwort: B**
**Detaillierte Erklärung:**
- Der Compiler versucht, Methoden-/Konstruktoraufrufe anhand einer strengen Prioritätenliste aufzulösen:
  1. **Genaue Übereinstimmung (Exact Match):** Suche nach einem Parameter vom Typ `int`. Da hier keiner existiert, suche nach dem Nächstbesten.
  2. **Erweiterung (Primitive Promotion):** Die Erweiterung von `int` zu `double` (über primitive Promotion) wird dem Autoboxing vorgezogen.
  3. **Autoboxing:** Autoboxing von `int` zu `Integer`.
  4. **Varargs:** Übereinstimmung mit den variablen Argumenten `int...`.
- Da die Erweiterung (Widening) dem Autoboxing und Varargs vorgezogen wird, befördert der Compiler `5` zu `5.0` und wählt den Konstruktor `MatchTest(double)`.
- Ausgabe: `double `.

---

### Frage 8: Statische Member und Vererbung (Hiding)
Was ist die Ausgabe bei der Ausführung der folgenden Klasse?
```java
class Super {
    public static void show() {
        System.out.print("Super ");
    }
}

class Sub extends Super {
    public static void show() {
        System.out.print("Sub ");
    }
}

public class StaticHiding {
    public static void main(String[] args) {
        Super s = new Sub();
        s.show();
    }
}
```
- A. `Sub `
- B. `Super `
- C. Kompiliert nicht, da statische Methoden nicht überschrieben werden können.
- D. Wirft zur Laufzeit eine `ClassCastException`.

**Antwort: B**
**Detaillierte Erklärung:**
- Statische Methoden **können nicht überschrieben werden**; sie können nur **verdeckt** (hidden) werden.
- Wenn eine statische Methode aufgerufen wird, wendet die JVM keinen dynamischen Dispatch (Polymorphie) an.
- Stattdessen wird die aufgerufene Methode streng durch den zur Kompilierzeit **deklarierten Referenztyp** der Variable bestimmt.
- Da `s` als `Super` deklariert ist, bindet der Compiler `s.show()` an `Super.show()`.
- Ausgabe: `Super `.
- *(Hinweis: Es gilt als schlechte Praxis, statische Methoden auf Instanzen aufzurufen. Sie sollten stattdessen `Super.show();` schreiben).*

---

### Frage 9: Auslösen der Klasseninitialisierung durch Konstanten
Was ist die Ausgabe des folgenden Programms?
```java
class Loaded {
    public static final int CONSTANT = 100;
    public static int variable = 200;
    static {
        System.out.print("LoadedClass ");
    }
}

public class TriggerTest {
    public static void main(String[] args) {
        int x = Loaded.CONSTANT;
        System.out.print(x + " ");
        int y = Loaded.variable;
        System.out.print(y);
    }
}
```
- A. `LoadedClass 100 200`
- B. `100 LoadedClass 200`
- C. `100 200 LoadedClass`
- D. `LoadedClass 100 LoadedClass 200`

**Antwort: B**
**Detaillierte Erklärung:**
- Der Zugriff auf eine statische `final` Variable, die als Kompilierzeit-Konstantenausdruck initialisiert ist, löst **kein** Laden oder Initialisieren der Klasse aus.
- Der Compiler kopiert den Wert (`100`) direkt in den Bytecode der aufrufenden Klasse (`TriggerTest`), sodass die JVM die Klasse `Loaded` in dieser Zeile nicht laden muss. Daher läuft `int x = Loaded.CONSTANT;` ohne Laden der Klasse ab und gibt `100 ` aus.
- Der Zugriff auf eine statische Variable, die nicht final ist (oder kein Kompilierzeit-Konstantenausdruck ist, wie `Loaded.variable`), löst jedoch das Laden und Initialisieren der Klasse aus.
- Wenn auf `Loaded.variable` zugegriffen wird, lädt die JVM `Loaded` und führt deren statischen Block aus, was `"LoadedClass "` ausgibt.
- Schließlich wird der Wert `200` ausgegeben.
- Ausgabe: `100 LoadedClass 200`.

---

### Frage 10: Uninitialisierte statische finale Felder (Blank Final)
Welche der folgenden Deklarationen von statischen Feldern kompiliert erfolgreich?
- A.
  ```java
  class StaticVar {
      public static final int VALUE;
  }
  ```
- B.
  ```java
  class StaticVar {
      public static final int VALUE;
      { VALUE = 10; }
  }
  ```
- C.
  ```java
  class StaticVar {
      public static final int VALUE;
      static { VALUE = 10; }
  }
  ```
- D.
  ```java
  class StaticVar {
      public static final int VALUE;
      public StaticVar() { VALUE = 10; }
  }
  ```

**Antwort: C**
**Detaillierte Erklärung:**
- Eine `static final` Variable muss genau einmal beim Laden der Klasse initialisiert werden.
- Sie kann **nicht** in Instanz-Gültigkeitsbereichen (wie Instanzblöcken oder Konstruktoren) initialisiert werden, da diese Blöcke erst bei der Instanziierung eines Objekts ausgeführt werden, und statische finale Variablen bereit sein müssen, bevor Instanzen erstellt werden.
- Daher muss sie wie folgt initialisiert werden:
  - Bei der Deklaration.
  - In einem **statischen Initialisierungsblock** (`static { ... }`).
- **C** verwendet korrekterweise einen statischen Initialisierungsblock. **A**, **B** und **D** führen zu Kompilierzeitfehlern.

---

### Frage 11: Zirkuläre Konstruktoraufrufe
Was ist das Kompilierungsergebnis des folgenden Codes?
```java
public class CycleConstructor {
    public CycleConstructor() {
        this(5);
    }
    public CycleConstructor(int x) {
        this();
    }
}
```
- A. Kompiliert erfolgreich, führt aber bei der Instanziierung zu einem `StackOverflowError`.
- B. Kompiliert nicht aufgrund eines rekursiven Konstruktoraufrufs.
- C. Kompiliert, warnt jedoch vor Deadlocks.
- D. Kompiliert und läuft sicher, solange keine Parameter übergeben werden.

**Antwort: B**
**Detaillierte Erklärung:**
- Java verbietet zirkuläre Konstruktor-Verkettungen (Konstruktoren, die sich im Kreis gegenseitig aufrufen).
- Der Compiler erkennt, dass `CycleConstructor()` den Konstruktor `CycleConstructor(int)` aufruft, welcher wiederum `CycleConstructor()` aufruft.
- Der Compiler markiert diese zirkuläre Abhängigkeit und lehnt den Code mit einem Kompilierzeitfehler ab: `recursive constructor invocation` (rekursiver Konstruktoraufruf).

---

### Frage 12: Exceptions in Superklassen-Konstruktoren
Betrachten Sie die folgenden Deklarationen:
```java
class BaseException extends Exception {}
 
class Parent {
    public Parent() throws BaseException {}
}
 
class Child extends Parent {
    // INSERT CONSTRUCTOR HERE
}
```
Welcher der folgenden Konstruktoren kann in `Child` eingefügt werden, damit der Code erfolgreich kompiliert?
- A. `public Child() {}`
- B. `public Child() throws Exception {}`
- C. `public Child() { try { super(); } catch(BaseException e) {} }`
- D. Keiner der oben genannten.

**Antwort: B**
**Detaillierte Erklärung:**
- Da der Unterklassenkonstruktor implizit oder explizit `super()` aufruft und der Elternkonstruktor `throws BaseException` deklariert, **muss der Unterklassenkonstruktor deklarieren, dass er dieselbe Exception (oder eine Oberklasse-Exception wie `Exception`) wirft**.
- **A ist falsch:** Er deklariert kein `throws`, was zu einem Kompilierzeitfehler wegen einer unbehandelten Exception führt.
- **C ist falsch:** Der Aufruf `super();` muss die allererste Anweisung in einem Konstruktor sein. Ihn in einen `try-catch`-Block zu setzen, verletzt diese Regel, weshalb der Code nicht kompiliert.
- **B is korrekt:** Deklariert `throws Exception`, was die vom Elternkonstruktor geworfene geprüfte Exception (checked Exception) abdeckt.

---

### Frage 13: Kovariante Rückgabetypen beim Überschreiben
Welche Methodendeklaration ist in einer Unterklasse von `Parent` gültig?
```java
class Parent {
    public Object getValue() { return null; }
}
```
- A. `public void getValue() {}`
- B. `public String getValue() { return "text"; }`
- C. `private Object getValue() { return null; }`
- D. `public Object getValue() throws Exception {}`

**Antwort: B**
**Detaillierte Erklärung:**
- **Kovariante Rückgabetypen** sind beim Überschreiben von Java-Methoden zulässig. Die Methode der Unterklasse kann einen Typ zurückgeben, der eine **Unterklasse** des vom Elternteil zurückgegebenen Typs ist (hier ist `String` eine Unterklasse von `Object`).
- **A ist falsch:** Der Rückgabetyp kann nicht in einen inkompatiblen Typ (wie `void`) geändert werden.
- **C ist falsch:** Eine überschreibende Methode darf keine **eingeschränktere** Zugriffsberechtigung zuweisen (von `public` zu `private`).
- **D ist falsch:** Eine überschreibende Methode darf keine neuen oder allgemeineren geprüften Exceptions werfen.

---

### Frage 14: Methodenüberladung mit Autoboxing vs. Varargs
Was wird ausgegeben?
```java
public class OverloadPrec {
    public static void test(Integer x) { System.out.print("Integer "); }
    public static void test(long x) { System.out.print("long "); }

    public static void main(String[] args) {
        test(5);
    }
}
```
- A. `Integer `
- B. `long `
- C. Kompiliert nicht.
- D. Wirft zur Laufzeit eine Exception.

**Antwort: B**
**Detaillierte Erklärung:**
- Bei der Auflösung überladener Methoden hat die Erweiterung (Widening / Primitive Promotion, z. B. `int` zu `long`) Vorrang vor dem Autoboxing (`int` zu `Integer`).
- Daher befördert der Compiler `5` zu einem `long` und ruft `test(long)` auf.
- Ausgabe: `long `.

---

### Frage 15: Abstrakte Klassen und Konstruktoren
Welche der folgenden Aussagen über abstrakte Klassen in Java ist wahr?
- A. Sie können keine Konstruktoren haben, da sie nicht instanziiert werden können.
- B. Sie können Konstruktoren haben, die während der Instanziierung der Unterklasse aufgerufen werden.
- C. Sie können Konstruktoren haben, diese müssen jedoch als `private` deklariert sein.
- D. Sie können keine statischen Methoden deklarieren.

**Antwort: B**
**Detaillierte Erklärung:**
- Obwohl man eine abstrakte Klasse nicht mit `new AbstractClass()` instanziieren kann, **haben abstrakte Klassen Konstruktoren**.
- Diese Konstruktoren werden von Unterklassen über die Konstruktor-Verkettung (`super()`) aufgerufen, um die in der abstrakten Elternklasse deklarierten Instanzfelder zu initialisieren.
- Daher ist B korrekt.

---

### Frage 16: Zugriff auf verdeckte Felder mittels super
Was ist die Ausgabe bei der Ausführung dieses Code-Segments?
```java
class A {
    int val = 10;
}
class B extends A {
    int val = 20;
    void show() {
        System.out.println(super.val + " " + this.val);
    }
}
public class FieldAccess {
    public static void main(String[] args) {
        new B().show();
    }
}
```
- A. `10 20`
- B. `20 20`
- C. `20 10`
- D. Kompiliert nicht, da `val` verdeckt ist.

**Antwort: A**
**Detaillierte Erklärung:**
- Wenn eine Instanzvariable durch eine Unterklasse verdeckt wird, kann die Unterklasse weiterhin über das Schlüsselwort `super` (`super.val`) auf das verdeckte Feld der Elternklasse zugreifen.
- Auf das Feld der Unterklasse wird mit `this.val` oder einfach `val` zugegriffen.
- Somit ergibt `super.val` den Wert `10` und `this.val` den Wert `20`.
- Ausgabe: `10 20`.

---

### Frage 17: Ausführungsreihenfolge statischer Blöcke bei mehreren Klassen
Was ist die Ausgabe bei der Ausführung des folgenden Programms?
```java
class X {
    static { System.out.print("X"); }
}
class Y extends X {
    static { System.out.print("Y"); }
}
public class ClassLoad {
    public static void main(String[] args) {
        Y y1 = new Y();
        Y y2 = new Y();
    }
}
```
- A. `XYXY`
- B. `XY`
- C. `YXYX`
- D. `YX`

**Antwort: B**
**Detaillierte Erklärung:**
- Statische Initialisierungsblöcke werden genau **einmal** ausgeführt, wenn die Klasse zum ersten Mal vom Classloader geladen wird.
- Das Erstellen der ersten Instanz `new Y()` lädt `X` (gibt `"X"` aus) und `Y` (gibt `"Y"` aus).
- Das Erstellen der zweiten Instanz `new Y()` löst kein Laden der Klassen aus, da diese bereits geladen sind. Es werden keine statischen Blöcke ausgeführt.
- Daher ist die Ausgabe `XY`.

---

### Frage 18: Uninitialisierte finale Felder in Konstruktoren mit Verzweigungen
Welche der folgenden Konstruktordeklarationen kompiliert erfolgreich?
- A.
  ```java
  class Test {
      final int x;
      public Test(boolean cond) {
          if (cond) x = 5;
      }
  }
  ```
- B.
  ```java
  class Test {
      final int x;
      public Test(boolean cond) {
          if (cond) { x = 5; } else { x = 10; }
      }
  }
  ```
- C.
  ```java
  class Test {
      final int x;
      public Test(boolean cond) {
          x = 5;
          if (cond) x = 10;
      }
  }
  ```
- D. Alle of the above.

**Antwort: B**
**Detaillierte Erklärung:**
- **A kompiliert nicht:** Wenn `cond` den Wert `false` hat, bleibt `x` uninitialisiert.
- **B kompiliert erfolgreich:** Beide Zweige der Bedingungsanweisung initialisieren `x` genau einmal.
- **C kompiliert nicht:** Wenn `cond` den Wert `true` hat, wird `x` zweimal zugewiesen (`x = 5` und dann `x = 10`), was die Regel verletzt, dass `final`-Variablen nur einmal zugewiesen werden können.

---

### Frage 19: Aufrufen abstrakter Methoden in Konstruktoren
Was ist die Ausgabe des folgenden Programms?
```java
abstract class Parent {
    Parent() {
        show();
    }
    abstract void show();
}

class Child extends Parent {
    int val = 42;
    void show() {
        System.out.println(val);
    }
}

public class AbstractConstructor {
    public static void main(String[] args) {
        new Child();
    }
}
```
- A. `42`
- B. `0`
- C. Kompiliert nicht.
- D. Wirft eine `NullPointerException`.

**Antwort: B**
**Detaillierte Erklärung:**
- Das Aufrufen abstrakter/überschreibbarer Methoden innerhalb eines Elternkonstruktors verhält sich ähnlich wie die Polymorphie-Falle bei Methoden.
- Wenn `new Child()` aufgerufen wird, läuft zuerst der Elternkonstruktor `Parent()` ab und ruft `show()` auf.
- Die überschriebene Methode `show()` der Unterklasse wird ausgeführt.
- Da das Instanzfeld `val` der Unterklasse noch nicht initialisiert wurde (die Zuweisung `val = 42` erfolgt erst nach dem Abschluss des Superklassen-Konstruktors), besitzt es seinen standardmäßigen primitiven Wert `0`.
- Daher gibt das Programm `0` aus.

---

### Frage 20: Konstruktoren und Varargs-Überladungsmehrdeutigkeit
Gegeben sei die Klasse:
```java
public class VarargAmb {
    public VarargAmb(int... x) { System.out.print("varargs "); }
    public VarargAmb(Integer... x) { System.out.print("Integer varargs "); }

    public static void main(String[] args) {
        new VarargAmb(1, 2);
    }
}
```
What is the result?
- A. Prints `varargs `
- B. Prints `Integer varargs `
- C. Kompiliert nicht aufgrund von Mehrdeutigkeit.
- D. Wirft einen Laufzeitfehler.

**Antwort: C**
**Detaillierte Erklärung:**
- Der Compiler kann sich bei der Auflösung von Varargs-Parameterlisten-Aufrufen nicht zwischen `int...` und `Integer...` entscheiden (beide werden bei den Boxing-Konvertierungsprioritäten für Varargs als gleichwertig eingestuft).
- Daher ist der Konstruktoraufruf mehrdeutig und der Compiler kann die Klasse nicht kompilieren.

