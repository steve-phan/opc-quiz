# Kapitel 2: Java-Speichermodell - Stack, Heap & Variablen

## 1. Kernziele der Java 21 Prüfung
- Unterscheidung zwischen Stack- und Heap-Speicher in der JVM.
- Deklaration, Initialisierung und Verwendung von primitiven Variablen und Objektreferenzen.
- Beherrschung von Wrapper-Klassen, Autoboxing und Unboxing.
- Anwendung der Typinferenz für lokale Variablen (`var`) und Verstehen der Compiler-Regeln.

---

## 2. Detaillierte Konzepte

### Stack- vs. Heap-Speicher
Java verwaltet den Speicher über zwei Hauptbereiche: Stack und Heap. Zu verstehen, wo Variablen und Objekte gespeichert werden, ist sowohl für die OCP-Prüfung als auch für das Debuggen von Speicherlecks (Memory Leaks) von entscheidender Bedeutung.

| Merkmal | Stack-Speicher | Heap-Speicher |
| :--- | :--- | :--- |
| **Zweck** | Speichert lokale Variablen und Methodenaufruf-Frames. | Speichert alle Objekte und deren Instanzvariablen. |
| **Lebenszyklus** | LIFO (Last-In, First-Out). Wird reserviert, wenn eine Methode aufgerufen wird, und freigegeben, wenn sie zurückkehrt. | Verwaltet vom Garbage Collector (GC). Objekte bleiben bestehen, solange sie erreichbar sind. |
| **Bereich** | Privat für den jeweiligen Ausführungsthread (Thread). | Global geteilt für alle Threads in der JVM. |
| **Fehler** | Wirft `StackOverflowError`, wenn der Stack-Speicher erschöpft ist. | Wirft `OutOfMemoryError`, wenn der Heap-Speicher erschöpft ist. |

```
+-----------------------------------------------------------+
| JVM SPEICHERLAYOUT                                        |
|                                                           |
|  [ Thread-Stack ]                     [ Globaler Heap ]   |
|  +--------------------+               +-----------------+ |
|  | main() Frame       |               |  Book Objekt    | |
|  |   - int price = 30 |               |  - title: "Java"| |
|  |   - Book ref  -------------------->|  - stock: 100   | |
|  +--------------------+               +-----------------+ |
|  | calculate() Frame  |                                   |
|  |   - double tax     |                                   |
|  +--------------------+                                   |
+-----------------------------------------------------------+
```

### Typinferenz für lokale Variablen (`var`)
Eingeführt in Java 10 und in späteren Versionen erweitert, ermöglicht `var` dem Compiler, den Typ lokaler Variablen basierend auf dem Initialisierungswert abzuleiten (Typinferenz). Sie wird direkt in den ermittelten Typ kompiliert (kein Laufzeit-Overhead).

#### Strikte Compiler-Regeln für `var` (Häufig im OCP getestet):
1. **Nur lokale Variablen:** Kann nur innerhalb von Methoden verwendet werden (lokale Variablen, Schleifen). Kann nicht für Klassenfelder, Methodenparameter oder Rückgabetypen verwendet werden.
2. **Sofortige Initialisierung:** Muss auf derselben Zeile deklariert und initialisiert werden.
   - `var x = 10;` (Gültig)
   - `var y; y = 20;` (Compilerfehler)
3. **Keine Initialisierung mit null:** Kann nicht direkt mit `null` initialisiert werden, da der Compiler den beabsichtigten Typ nicht bestimmen kann.
   - `var name = null;` (Compilerfehler)
   - `var name = (String) null;` (Gültig, aber nicht empfohlen)
4. **Keine zusammengesetzten Deklarationen:** Kann nicht in einer durch Kommas getrennten Liste verwendet werden.
   - `var a = 1, b = 2;` (Compilerfehler)
5. **Var ist kein Schlüsselwort:** `var` ist ein reservierter Typname, kein reserviertes Schlüsselwort. Sie können eine Variable oder Methode namens `var` deklarieren (z. B. `int var = 5;`), wovon jedoch dringend abgeraten wird.

---

## 3. JVM-Interna & Speicherlayout

### Struktur von Stack-Frames
Jeder Thread in der JVM besitzt seinen eigenen Ausführungsstack. Jeder Methodenaufruf reserviert einen **Stack-Frame**. Ein Stack-Frame enthält:
1. **Local Variable Array (LVA):** Ein Array, das lokale Variablen und Methodenparameter speichert. Primitive Typen speichern ihre literalen Werte direkt in diesem Array. Referenzen speichern eine 32-Bit- oder 64-Bit-Speicheradresse, die auf das Objekt im Heap verweist.
2. **Operand Stack (Operandenstack):** Ein Arbeitsbereich, in dem Bytecode-Befehle Werte auf- und ablegen (push/pop), um arithmetische oder logische Operationen durchzuführen.
3. **Frame-Daten:** Metadaten zur Unterstützung der Methodenauflösung, Exception-Behandlung und Rückgabewerte.

### Autoboxing & Unboxing Interna
Wrapper-Klassen (z. B. `Integer`, `Double`, `Boolean`) verpacken primitive Werte in eine Objektstruktur auf dem Heap.
- **Autoboxing:** Der Compiler ersetzt primitive Typen durch ein Wrapper-Objekt. Im Hintergrund ruft Java `Integer.valueOf(primitive)` auf.
- **Unboxing:** Der Compiler extrahiert den primitiven Wert. Im Hintergrund ruft Java `wrapper.intValue()` auf.

*OCP-Falle:* Autoboxing nutzt für bestimmte Werte ein Caching. `Integer.valueOf(x)` cacht Werte zwischen `-128` und `127`.
- `Integer a = 100; Integer b = 100; System.out.println(a == b);` gibt `true` aus (Referenzen sind aufgrund des Caches identisch).
- `Integer c = 200; Integer d = 200; System.out.println(c == d);` gibt `false` aus (Referenzen sind unterschiedlich, da 200 außerhalb des Cache-Bereichs liegt).

---

## 4. Tricky OCP Exam Questions

### Frage 1: Stack- vs. Heap-Speicherallokation
Betrachten Sie das folgende Programm:
```java
public class AllocationTracker {
    private int id;
    private String name;
    
    public AllocationTracker(int id, String name) {
        this.id = id;
        this.name = name;
    }

    public static void main(String[] args) {
        int localId = 105;
        String localName = "Tracker";
        AllocationTracker tracker = new AllocationTracker(localId, localName);
    }
}
```
Welche der folgenden Aussagen beschreibt zutreffend, wo sich diese Variablen und Objekte im Speicher befinden? (Wählen Sie alle zutreffenden Antworten aus)
- A. Die Variable `localId` wird direkt auf dem Stack gespeichert.
- B. Die Variable `tracker` (die Referenz) wird auf dem Stack gespeichert.
- C. Das mit `new` erstellte `AllocationTracker`-Objekt wird auf dem Heap gespeichert.
- D. Das Instanzfeld `id` des `AllocationTracker`-Objekts wird auf dem Stack gespeichert.
- E. Das String-Objekt `"Tracker"` wird auf dem Heap gespeichert.

**Answer: A, B, C, E**
**Detailed Explanation (German):**
- **A ist korrekt:** `localId` ist eine lokale primitive Variable innerhalb der `main`-Methode, daher wird sie direkt im lokalen Variablen-Array (LVA) des Stack-Frames der `main`-Methode gespeichert.
- **B ist korrekt:** `tracker` ist eine lokale Referenzvariable. Die Referenz selbst (die 32-Bit- oder 64-Bit-Speicheradresse) wird auf dem Stack gespeichert.
- **C ist korrekt:** Alle Objekte, die über das Schlüsselwort `new` instanziiert werden, werden auf dem Heap zugewiesen.
- **D ist falsch:** Obwohl `id` ein primitiver Typ (`int`) ist, handelt es sich um eine *Instanzvariable* (ein Mitglied der Klasse `AllocationTracker`). Instanzvariablen werden innerhalb der Objektstruktur selbst gespeichert, die sich auf dem Heap befindet.
- **E ist korrekt:** Strings (sowohl Literale als auch Objekte) befinden sich auf dem Heap (speziell im String Constant Pool oder Heap-Speicher).

---

### Frage 2: Typinferenz für lokale Variablen (`var`) - Verwendung bei Feldern
Gegeben ist die folgende Klassendefinition:
```java
public class FieldVar {
    private var limit = 100;
    public static var factor = 2.5;

    public void process(var input) {
        var result = input;
    }
}
```
Welche Zeilen in diesem Code verursachen einen Compilerfehler?
- A. Nur `private var limit = 100;`
- B. Nur `public static var factor = 2.5;`
- C. Nur `public void process(var input)`
- D. `private var limit = 100;`, `public static var factor = 2.5;` und `public void process(var input)`
- E. Der Code kompiliert ohne Fehler.

**Answer: D**
**Detailed Explanation (German):**
- Das Schlüsselwort `var` zur Typinferenz lokaler Variablen ist streng auf **lokale Variablen** innerhalb von Methoden, Konstruktoren oder Schleifenblöcken beschränkt.
- Es kann **nicht** verwendet werden für:
  - Instanzfelder (`private var limit`)
  - Statische Felder (`public static var factor`)
  - Methodenparameter (`var input`)
  - Methodenrückgabetypen (z. B. `public var calculate() { return 5; }`)
- Daher verursachen alle drei Deklarationen Compilerfehler.

---

### Frage 3: Ungültige `var`-Deklarationen
Welche der folgenden Deklarationen lokaler Variablen unter Verwendung von `var` lassen sich nicht kompilieren? (Wählen Sie alle zutreffenden Antworten aus)
- A. `var a = 1, b = 2;`
- B. `var name = (String) null;`
- C. `var list = new java.util.ArrayList<>();`
- D. `var matrix = { {1, 2}, {3, 4} };`
- E. `var path; path = "home";`

**Answer: A, D, E**
**Detailed Explanation (German):**
- **A führt zum Fehler / kompiliert nicht:** Zusammengesetzte Deklarationen (durch Kommas getrennte Listen) sind mit `var` verboten, selbst wenn alle Variablen initialisiert sind.
- **B kompiliert:** Die Deklaration `var name = null;` schlägt fehl. Wenn Sie jedoch die Null-Referenz auf einen bestimmten Typ casten, wie `(String) null`, kann der Compiler folgern, dass der Typ der Variablen `String` ist.
- **C kompiliert:** Dies kompiliert. Da der Diamond-Operator `<>` jedoch keinen Typparameter spezifiziert, leitet der Compiler `ArrayList<Object>` ab.
- **D führt zum Fehler / kompiliert nicht:** Array-Initialisierer ohne expliziten Typ (z. B. `{1, 2}`) sind mit `var` nicht zulässig. Um dies zu kompilieren, müssen Sie schreiben: `var matrix = new int[][]{ {1, 2}, {3, 4} };`.
- **E führt zum Fehler / kompiliert nicht:** Variablen, die mit `var` deklariert werden, müssen auf derselben Zeile initialisiert werden. Das Aufteilen von Deklaration und Initialisierung verursacht einen Compilerfehler.

---

### Frage 4: NullPointerExceptions bei Autoboxing und Unboxing
Was ist das Ergebnis des Versuchs, den folgenden Code zu kompilieren und auszuführen?
```java
public class BoxNull {
    public static void main(String[] args) {
        Integer val = null;
        int num = val;
        System.out.println(num);
    }
}
```
- A. Gibt `null` aus
- B. Gibt `0` aus
- C. Wirft zur Laufzeit eine `NullPointerException`.
- D. Der Compiler schlägt fehl, da `Integer` nicht zu `int` zugewiesen werden kann.

**Answer: C**
**Detailed Explanation (German):**
- Der Code kompiliert ohne Fehler. Der Compiler übersetzt `int num = val;` automatisch in `int num = val.intValue();` (Unboxing).
- Da `val` zur Laufzeit jedoch `null` ist, führt der Aufruf von `val.intValue()` zu einer `NullPointerException`.
- Dies ist eine sehr häufige Falle in der OCP-Prüfung, bei der Null-Wrapper-Objekte implizit entpackt (unboxed) werden.

---

### Frage 5: Integer-Cache-Bereich und Gleichheit
Was gibt der folgende Code aus?
```java
public class CacheCompare {
    public static void main(String[] args) {
        Integer a = 127;
        Integer b = 127;
        Integer c = 128;
        Integer d = 128;
        
        System.out.print((a == b) + " " + (c == d) + " " + c.equals(d));
    }
}
```
- A. `true true true`
- B. `true false false`
- C. `true false true`
- D. `false false true`

**Answer: C**
**Detailed Explanation (German):**
- Wenn einem `Integer`-Wrapper ein `int`-Literal zugewiesen wird, erfolgt das Autoboxing über `Integer.valueOf()`.
- Java cacht `Integer`-Instanzen für Werte von `-128` bis `127`.
- `a` und `b` liegen in diesem Bereich, sodass `a == b` dieselbe gecachte Objekt-Referenz auf dem Heap vergleicht, was `true` ergibt.
- `c` und `d` (Wert `128`) liegen außerhalb des Cache-Bereichs, sodass separate `Integer`-Objekte auf dem Heap erstellt werden. Der Referenzvergleich `c == d` ergibt `false`.
- Die Methode `.equals()` vergleicht die tatsächlichen Werte, nicht die Speicheradressen der Referenzen. Da beide `128` einhüllen, ergibt `c.equals(d)` den Wert `true`.
- Kombination dieser Werte: `true false true`.

---

### Frage 6: Berechtigung zur Garbage Collection
An welchem Punkt in der folgenden Methode wird das ursprünglich von `obj1` referenzierte Objekt für die Garbage Collection freigegeben?
```java
public class GCTest {
    public void execute() {
        Object obj1 = new Object(); // Line 3
        Object obj2 = new Object(); // Line 4
        obj1 = obj2;                // Line 5
        obj2 = null;                // Line 6
        // Line 7
    }
}
```
- A. In Zeile 5
- B. In Zeile 6
- C. In Zeile 7 (wenn die Methode zurückkehrt)
- D. Es ist erst für die GC freigegeben, wenn die Anwendung beendet wird.

**Answer: A**
**Detailed Explanation (German):**
- Ein Objekt ist für die Garbage Collection freigegeben, wenn es keine aktiven, erreichbaren Referenzen mehr gibt, die darauf zeigen.
- **Zeile 3:** Ein neues Objekt (nennen wir es Objekt-A) wird erstellt. `obj1` referenziert Objekt-A.
- **Zeile 4:** Ein weiteres Objekt (Objekt-B) wird erstellt. `obj2` referenziert Objekt-B.
- **Zeile 5:** `obj1` wird so umgeschrieben, dass es auf dasselbe Objekt wie `obj2` (Objekt-B) zeigt. Ab diesem Zeitpunkt gibt es keine Referenzen mehr, die auf Objekt-A zeigen. Objekt-A wird somit sofort in Zeile 5 für die Garbage Collection freigegeben.
- **Zeile 6:** `obj2` wird auf `null` gesetzt, aber Objekt-B ist weiterhin über `obj1` erreichbar. Daher ist Objekt-B noch nicht für die GC freigegeben.

---

### Frage 7: `var`-Typinferenz in Schleifen
Gegeben sei die folgende Methode. Welche Zeilen lassen sich erfolgreich kompilieren? (Wählen Sie alle zutreffenden Antworten aus)
```java
import java.util.List;
public class LoopVar {
    public void run() {
        var list = List.of("A", "B", "C"); // Line 4
        for (var item : list) {             // Line 5
            System.out.print(item);
        }
        for (var i = 0; i < 3; i++) {       // Line 8
            System.out.print(i);
        }
    }
}
```
- A. Nur Zeile 4
- B. Nur die Zeilen 4 und 5
- C. Nur die Zeilen 4 und 8
- D. Alle Zeilen (4, 5 und 8) lassen sich erfolgreich kompilieren.

**Answer: D**
**Detailed Explanation (German):**
- `var` ist innerhalb von Schleifen völlig gültig:
  - **Zeile 4:** Ermittelt den Typ `List<String>`.
  - **Zeile 5:** Typinferenz bei einer erweiterten `for`-Schleife. Da `list` eine Sammlung von Strings ist, leitet der Compiler für `var item` den Typ `String` ab.
  - **Zeile 8:** Traditionelle `for`-Schleifenindex-Initialisierung. Der Compiler leitet für `var i` den Typ `int` ab.
- Alle Deklarationen entsprechen den Regeln für lokale Variablen, sodass die Klasse fehlerfrei kompiliert.

---

### Frage 8: Shadowing (Überschattung) und Bezeichnerinitialisierung
Was ist das Ergebnis der Ausführung der folgenden Klasse?
```java
public class ShadowTest {
    static int x = 10;
    
    public static void main(String[] args) {
        int x = x; 
        System.out.println(x);
    }
}
```
- A. Gibt `10` aus
- B. Gibt `0` aus
- C. Compilerfehler aufgrund einer doppelten Variablendeklaration.
- D. Compilerfehler, da `x` bei seiner eigenen Initialisierung verwendet wird.

**Answer: D**
**Detailed Explanation (German):**
- In der Zeile `int x = x;` überschattet (shadows) die lokale Variable `x` das statische Klassenfeld `x`.
- Wenn der Compiler `x = x` analysiert, löst er das `x` auf der rechten Seite als die lokale Variable `x` auf, die gerade deklariert wird, und NICHT als die statische Klassenvariable `ShadowTest.x`.
- Da lokale Variablen keine Standardwerte besitzen und vor dem Lesen initialisiert werden müssen, führt der Versuch, die lokale Variable `x` sich selbst zuzuweisen, bevor sie initialisiert wurde, zu einem Compilerfehler: `variable x might not have been initialized`.
- Um dies zu vermeiden, müsste man schreiben: `int x = ShadowTest.x;`.

---

### Frage 9: Benennungsregeln für Java-Identifikatoren
Welche der folgenden Bezeichner sind in Java gültig und können zur Benennung von Variablen verwendet werden? (Wählen Sie alle zutreffenden Antworten aus)
- A. `$money`
- B. `_name`
- C. `9to5`
- D. `var`
- E. `_`
- F. `public`

**Answer: A, B, D**
**Detailed Explanation (German):**
- **A ist korrekt:** Identifikatoren können mit einem Buchstaben, einem Währungssymbol (`$`) oder einem Unterstrich (`_`) beginnen.
- **B ist korrekt:** Identifikatoren können mit einem Unterstrich beginnen.
- **C ist falsch:** Identifikatoren dürfen nicht mit einer Ziffer beginnen (darf nicht mit `9` starten).
- **D ist korrekt:** `var` ist ein *reservierter Typname*, kein Schlüsselwort. Das bedeutet, es kann als Variablenbezeichner verwendet werden (z. B. `int var = 5;` kompiliert, obwohl es als extrem schlechter Stil gilt).
- **E ist falsch:** Seit Java 9 ist der einzelne Unterstrich `_` ein reserviertes Schlüsselwort und kann nicht mehr als Identifikator verwendet werden.
- **F ist falsch:** `public` ist ein reserviertes Schlüsselwort und kann nicht als Bezeichner verwendet werden.

---

### Frage 10: Implizite Verengung und primitive Zuweisungen
Welche der folgenden Zuweisungen werden ohne expliziten Cast kompiliert? (Wählen Sie alle zutreffenden Antworten aus)
- A. `byte b = 127;`
- B. `byte b = 128;`
- C. `int val = 10; byte b = val;`
- D. `final int val = 10; byte b = val;`
- E. `char c = 65;`

**Answer: A, D, E**
**Detailed Explanation (German):**
- **A ist korrekt:** `127` ist eine Konstante zur Compilezeit innerhalb des Bereichs eines `byte` (`-128` bis `127`). Java wendet eine implizite Verengung (Implicit Narrowing) an.
- **B ist falsch:** `128` liegt außerhalb des `byte`-Bereichs, sodass der Compiler dies ohne expliziten Cast (`(byte) 128`) ablehnt.
- **C ist falsch:** Obwohl der Wert `10` in ein Byte passt, ist `val` eine Variable, keine Konstante zur Compilezeit. Der Compiler kann nicht garantieren, dass sich der Wert von `val` zur Laufzeit nicht ändert, weshalb ein expliziter Cast erforderlich ist.
- **D ist korrekt:** Da `val` als `final` deklariert und mit einem konstanten Ausdruck (`10`) initialisiert wurde, wird es als Compilezeit-Konstante behandelt. Da `10` in den Byte-Bereich passt, ist die implizite Verengung zulässig.
- **E ist korrekt:** `65` ist ein konstanter Ausdruck, der in den Bereich von `char` (`0` bis `65.535`) passt und ohne Probleme kompiliert.

---

### Frage 11: Fließkomma-Wrapper-Cache
Was ist das Ergebnis der Ausführung des folgenden Codeausschnitts?
```java
Double d1 = 1.0;
Double d2 = 1.0;
Float f1 = 2.0f;
Float f2 = 2.0f;
System.out.print((d1 == d2) + " " + (f1 == f2));
```
- A. `true true`
- B. `true false`
- C. `false false`
- D. `false true`

**Answer: C**
**Detailed Explanation (German):**
- Im Gegensatz zu `Integer`, `Byte`, `Short`, `Long` und `Character` implementieren die Fließkomma-Wrapper **`Double`** und **`Float`** KEIN Caching für irgendwelche Wertebereiche.
- Jede Autoboxing-Zuweisung eines Fließkomma-Literals (z. B. `Double d1 = 1.0;`) erstellt ein völlig neues Objekt auf dem Heap.
- Daher geben die Referenzvergleiche `d1 == d2` und `f1 == f2` beide `false` zurück.

---

### Frage 12: `var` mit Lambda-Ausdrücken
Welche Variableninitialisierung kompiliert erfolgreich, basierend auf dem folgenden Codeblock?
```java
// Option A
var x = () -> System.out.println("Hello");

// Option B
var y = (Runnable) () -> System.out.println("Hello");

// Option C
var z = System.out::println;
```
- A. Nur Option A
- B. Nur Option B
- C. Nur Option C
- D. Keine der Optionen lässt sich kompilieren.

**Answer: B**
**Detailed Explanation (German):**
- Um einen Lambda-Ausdruck oder eine Methodenreferenz zu kompilieren, benötigt der Compiler einen **Zieltyp** (ein Functional Interface).
- `var` allein bietet keinen Zieltyp, sodass `var x = () -> ...` und `var z = ...` fehlschlagen, da der Compiler nicht ableiten kann, welches Functional Interface implementiert werden soll.
- Wenn Sie jedoch das Lambda explizit in einen funktionalen Schnittstellenzieltyp casten, wie `(Runnable)`, kann der Compiler den Typ von `y` als `Runnable` ableiten. Somit kompiliert Option B erfolgreich.

---

### Frage 13: Initialisierungsregeln für lokale Variablen
Was ist das Ergebnis der Ausführung des folgenden Codes?
```java
public class LocalInit {
    public static void main(String[] args) {
        int x;
        boolean check = false;
        if (check) {
            x = 10;
        } else {
            // empty
        }
        System.out.println(x);
    }
}
```
- A. Gibt `0` aus
- B. Gibt `10` aus
- C. Wirft zur Laufzeit eine `NullPointerException`.
- D. Compilerfehler.

**Answer: D**
**Detailed Explanation (German):**
- Lokale Variablen müssen explizit initialisiert werden, bevor sie gelesen werden können.
- Der Compiler führt eine Flussanalyse durch, um zu prüfen, ob jeder mögliche Pfad die Variable initialisiert.
- In diesem Code fließt die Ausführung bei `check = false` in den `else`-Zweig, der `x` nicht initialisiert.
- Da es einen Pfad gibt, auf dem `x` nicht initialisiert wird, bevor es an `System.out.println(x)` übergeben wird, erzeugt der Compiler einen Fehler: `variable x might not have been initialized`.

---

### Frage 14: Numerische Promotionsregeln
Welchen Typ hat die resultierende Variable `result` im folgenden Ausdruck?
```java
byte a = 10;
short b = 20;
var result = a + b;
```
- A. `byte`
- B. `short`
- C. `int`
- D. `double`

**Answer: C**
**Detailed Explanation (German):**
- Binäre Java-Operatoren (wie `+`) wenden Regeln zur **numerischen Promotion** an:
  - Wenn ein Operand ein `double` ist, wird der andere in ein `double` konvertiert.
  - Andernfalls, wenn ein Operand ein `float` ist, wird the andere in ein `float` konvertiert.
  - Andernfalls, wenn ein Operand ein `long` ist, wird der andere in ein `long` konvertiert.
  - Andernfalls werden **beide** Operanden in ein `int` konvertiert (selbst wenn keiner von beiden ein `int` ist).
- Da `a` ein `byte` und `b` ein `short` ist, werden beide vor der Addition in ein `int` konvertiert. Das Ergebnis ist vom Typ `int`. Die Verwendung von `var` bestimmt den Typ der Variablen `result` als `int`.

---

### Frage 15: Cache-Verhalten von Character und Integer
Was ist die Ausgabe bei Ausführung der folgenden Anweisungen?
```java
Character c1 = 'A';
Character c2 = 'A';
Character c3 = '\u00ff';
Character c4 = '\u00ff';
System.out.print((c1 == c2) + " " + (c3 == c4));
```
- A. `true true`
- B. `true false`
- C. `false false`
- D. `false true`

**Answer: B**
**Detailed Explanation (German):**
- Die Wrapper-Klasse `Character` cacht Instanzen für Zeichenwerte im ASCII-Bereich, speziell von `\u0000` bis `\u007f` (Wert `0` bis `127`).
- `'A'` hat einen Ganzzahlwert von `65`, was innerhalb des Cache-Bereichs liegt, sodass `c1 == c2` den Wert `true` ergibt.
- `\u00ff` hat einen Ganzzahlwert von `255`, was außerhalb des gecachten Bereichs (`127`) liegt, sodass neue Instanzen erstellt werden. Der Vergleich `c3 == c4` ergibt `false`.

---

### Frage 16: Zusammengesetzte Zuweisungsoperatoren und impliziter Cast
Betrachten Sie die folgenden Anweisungen:
```java
int x = 5;
long y = 10;
x = x + y;  // Line 3
x += y;     // Line 4
```
Welche der folgenden Aussagen ist wahr?
- A. Sowohl Zeile 3 als auch Zeile 4 lassen sich erfolgreich kompilieren.
- B. Zeile 3 lässt sich nicht kompilieren, aber Zeile 4 lässt sich erfolgreich kompilieren.
- C. Zeile 3 lässt sich erfolgreich kompilieren, aber Zeile 4 lässt sich nicht kompilieren.
- D. Beide Zeilen lassen sich nicht kompilieren.

**Answer: B**
**Detailed Explanation (German):**
- **Zeile 3 (schlägt fehl / kompiliert nicht):** Der Ausdruck `x + y` konvertiert `x` in ein `long` und führt die Addition aus. Das Ergebnis ist vom Typ `long`. Sie können ein `long` nicht ohne expliziten Cast einer `int`-Variablen zuweisen.
- **Zeile 4 (kompiliert):** Zusammengesetzte Zuweisungsoperatoren (wie `+=`, `-=`, `*=`, `/=`) enthalten einen **impliziten Cast**. Der Ausdruck `x += y` ist äquivalent zu `x = (int) (x + y)`. Daher kompiliert er fehlerfrei.

---

### Frage 17: Typinferenz für lokale Variablen in generischen Deklarationen
Welcher Typ wird vom Compiler für die Variable `list` in der folgenden Deklaration abgeleitet?
```java
var list = new java.util.ArrayList<>();
```
- A. `ArrayList<Object>`
- B. `ArrayList<String>`
- C. `ArrayList<Void>`
- D. Der Code kompiliert nicht, da der Typparameter leer ist.

**Answer: A**
**Detailed Explanation (German):**
- Der Code kompiliert erfolgreich.
- Wenn `var` mit dem Diamond-Operator `<>` kombiniert wird, ohne dass ein Typparameter angegeben ist, kann der Compiler keinen spezifischen Typ ableiten, sodass er standardmäßig den Typparameter auf `java.lang.Object` setzt.
- Daher ist der abgeleitete Typ `ArrayList<Object>`.

---

### Frage 18: Primitiver Unterlauf und Überlauf
Was gibt der folgende Code aus?
```java
int val1 = Integer.MAX_VALUE;
int val2 = val1 + 1;
System.out.println(val2 < val1);
```
- A. `true`
- B. `false`
- C. Wirft zur Laufzeit eine `ArithmeticException` aufgrund eines Überlaufs.
- D. Compilerfehler.

**Answer: A**
**Detailed Explanation (German):**
- In Java lösen primitive Ganzzahlberechnungen bei Überlauf (Overflow) oder Unterlauf (Underflow) keine Ausnahmen aus. Stattdessen findet ein geräuschloser Überlauf statt.
- `Integer.MAX_VALUE` ist `2.147.483.647`.
- Das Addieren von `1` führt zu einem Überlauf, der sich auf den kleinsten negativen Wert `Integer.MIN_VALUE` (`-2.147.483.648`) auswirkt.
- Da `-2.147.483.648` kleiner als `2.147.483.647` ist, wird die Bedingung `val2 < val1` als `true` ausgewertet.

---

### Frage 19: Status der Methode finalize()
Welche der folgenden Aussagen zur Methode `finalize()` für Objekte in modernen Java-Versionen (wie Java 21) ist korrekt?
- A. Es ist garantiert, dass sie unmittelbar vor der Freigabe des Speichers eines Objekts aufgerufen wird.
- B. Sie ist seit Java 9 veraltet und wurde in Java 18 entfernt, sodass ihr Aufruf oder ihr Überschreiben einen Compilerfehler verursacht.
- C. Sie ist veraltet (seit Java 9) und sollte nicht verwendet werden, ist jedoch in `java.lang.Object` zur Abwärtskompatibilität weiterhin vorhanden.
- D. Das Überschreiben von `finalize()` ist der empfohlene Weg, um Ressourcen in Java 21 zu schließen.

**Answer: C**
**Detailed Explanation (German):**
- Das Überschreiben von `finalize()` gilt seit langem als unvorhersehbar, langsam und gefährlich für das Ressourcenmanagement.
- Es wurde in Java 9 als veraltet markiert. Obwohl es Vorschläge gab, es zu entfernen, existiert es in Java 21 immer noch in `java.lang.Object` zur Abwärtskompatibilität, was bedeutet, dass das Überschreiben kompiliert wird (mit Deprecation-Warnungen).
- **AutoCloseable** und das **try-with-resources**-Statement sind die Standard- und empfohlenen Mechanismen für das Aufräumen von Ressourcen.

---

### Frage 20: Literalsuffixe und Typen
Welchen Datentyp haben jeweils die Literale `0x7FFF_FFFF` bzw. `2.0`?
- A. `short` und `float`
- B. `int` und `double`
- C. `long` und `double`
- D. `int` und `float`

**Answer: B**
**Detailed Explanation (German):**
- Hexadezimal-Literale, die mit `0x` beginnen und kein Suffix (wie `L` oder `l`) besitzen, werden als `int` behandelt (sofern sie in den Bereich passen). `0x7FFF_FFFF` entspricht `Integer.MAX_VALUE`, daher ist sein Typ `int`.
- Fließkommaliterale ohne Suffix (wie `f`, `F`, `d`, `D`) sind in Java standardmäßig **`double`**.
- Daher sind die Typen `int` bzw. `double`.
