# Kapitel 8: Modernes OOP - Sealed Classes, Records & Pattern Matching

## 1. Core Java 21 Prüfungsziele
- Versiegelte Klassen (Sealed Classes) und Interfaces implementieren sowie Einschränkungen für Unterklassen verstehen.
- Moderne Datenträger mittels Java Records implementieren.
- Kanonische, kompakte und überladene Konstruktoren in Records schreiben.
- Typpattern-Matching (Type Pattern Matching) mit `instanceof` und `switch`-Ausdrücken anwenden.
- Record-Patterns (Record Patterns) zur automatischen Record-Dekonstruktion beherrschen.

---

## 2. Detaillierte Konzepte

### Versiegelte Klassen (Sealed Classes) und Interfaces
Sealed Classes ermöglichen es Entwicklern zu steuern, welche Klassen sie erweitern oder implementieren dürfen. Dies wird über die Schlüsselwörter `sealed` und `permits` deklariert.

#### Strikte Compiler-Regeln für Sealed Classes:
1. **Die `permits`-Klausel:** Eine Sealed Class muss ihre erlaubten Unterklassen mittels `permits` auflisten. Wenn die Unterklassen in derselben Quelldatei definiert sind, kann die `permits`-Klausel weggelassen werden, und der Compiler erkennt sie automatisch.
2. **Deklaration der Unterklassen:** Jede Unterklasse, die eine Sealed Class erweitert, muss explizit genau einen der folgenden drei Modifizierer deklarieren:
   - **`final`:** Die Unterklasse kann nicht weiter erweitert werden (schließt die Hierarchie).
   - **`sealed`:** Die Unterklasse ist ebenfalls versiegelt und muss ihre eigenen erlaubten Unterklassen definieren.
   - **`non-sealed`:** Die Unterklasse wird geöffnet, sodass jede beliebige Klasse von ihr erben kann (bricht die Versiegelungseinschränkung auf).
3. **Gleiches Modul/Paket:** Erlaubte Unterklassen müssen im selben Paket (oder im selben Modul bei Verwendung von JPMS) wie die Sealed Class liegen.

### Java Records (Datenträger ohne Boilerplate)
Ein **Record** ist ein spezieller unveränderlicher (immutable) Klassentyp, der ausschließlich zum Speichern von Daten gedacht ist. Durch die Deklaration eines Records generiert der Compiler automatisch:
- `private final`-Felder für alle Record-Komponenten.
- Einen öffentlichen Konstruktor (den sogenannten **Kanonischen Konstruktor**).
- Öffentliche Accessor-Methoden, die den Namen der Komponenten entsprechen (z. B. `id()` statt `getId()`).
- Implementierungen von `toString()`, `equals()` und `hashCode()` basierend auf allen Feldern.

#### Record-Konstruktoren:
- **Kanonischer Konstruktor (Canonical Constructor):** Wird automatisch generiert, kann aber explizit geschrieben werden, um Daten zu validieren oder zu normalisieren.
- **Kompakter Konstruktor (Compact Constructor):** Eine spezielle, für Records einzigartige Kurzschreibweise. Er hat **keine Parameter** und keine Klammern. Er läuft *vor* der Zuweisung der Felder ab und eignet sich hervorragend für Validierungen.
  ```java
  public record Book(String title, double price) {
      public Book { // Kompakter Konstruktor (keine Parameter!)
          if (price < 0.0) throw new IllegalArgumentException("Price cannot be negative");
          // Zuweisungen (this.title = title) erfolgen automatisch am Ende dieses Blocks!
      }
  }
  ```
- **Überladene Konstruktoren (Overloaded Constructors):** Müssen in ihrer allerersten Zeile mittels `this(...)` an den kanonischen Konstruktor delegieren.

---

## 3. JVM-Interna & Speicherlayout

### Struktur kompilierter Records
Auf Bytecode-Ebene ist ein Record eine normale Klasse, die direkt von `java.lang.Record` erbt. Da Java keine Mehrfachvererbung von Klassen unterstützt, **können Records keine anderen Klassen erweitern**. Sie können jedoch Interfaces implementieren.
Records sind implizit `final` und können nicht als `abstract` deklariert werden.

```
+--------------------------------------------------------------+
| COMPILED RECORD STRUCTURE                                    |
|                                                              |
| public final class Customer extends java.lang.Record {       |
|     private final String name;                               |
|     private final String email;                              |
|                                                              |
|     // Accessors                                             |
|     public String name() { return this.name; }               |
|     public String email() { return this.email; }             |
| }                                                            |
+--------------------------------------------------------------+
```

### Record-Patterns (Dekonstruktion in Java 21)
Java 21 führt **Record-Patterns** (auch bekannt als Record-Destructuring) ein. Anstatt ein Record zu matchen und danach dessen Accessor-Methoden aufzurufen, extrahiert ein Record-Pattern die einzelnen Komponenten direkt in der bedingten Anweisung.

```java
public void printCustomer(Object obj) {
    // Record-Pattern-Match dekonstruiert die Record-Komponenten automatisch!
    if (obj instanceof Customer(String name, String email, int points)) {
        System.out.println("Customer Name: " + name + ", Points: " + points);
    }
}
```

---

## 4. Tricky OCP Exam Questions

### Frage 1: Modifikatoreinschränkungen für Unterklassen von versiegelten Klassen
Welche der erlaubten Unterklassen in der folgenden Deklaration einer versiegelten Klasse (sealed class) lässt sich nicht kompilieren?
```java
// Parent Sealed Class
public sealed class Shape permits Circle, Square, Triangle, Hexagon {}

// Subclass A
final class Circle extends Shape {}

// Subclass B
sealed class Square extends Shape permits ColoredSquare {}
final class ColoredSquare extends Square {}

// Subclass C
non-sealed class Triangle extends Shape {}

// Subclass D
class Hexagon extends Shape {}
```
- A. Nur Circle
- B. Nur Square
- C. Nur Triangle
- D. Nur Hexagon

**Antwort: D**
**Ausführliche Erklärung:**
- Gemäß den Java-Regeln für versiegelte Klassen (Sealed Classes) muss jede erlaubte Unterklasse einer versiegelten Klasse explizit genau einen von drei Unterklassen-Modifizierern deklarieren, um festzulegen, wie die Vererbungshierarchie verwaltet wird:
  - **`final`:** Schließt die Hierarchie (die Unterklasse kann nicht weiter erweitert werden). `Circle` ist gültig.
  - **`sealed`:** Setzt die versiegelte Hierarchie fort. Sie muss ihre eigenen erlaubten Unterklassen deklarieren. `Square` ist gültig, da sie `ColoredSquare` erlaubt.
  - **`non-sealed`:** Öffnet die Hierarchie. Jede beliebige Klasse kann `Triangle` erweitern. `Triangle` ist gültig.
- **Hexagon (Unterklasse D)** lässt sich nicht kompilieren, da sie keinen der drei erforderlichen Modifizierer (`final`, `sealed` oder `non-sealed`) deklariert.
- Daher ist `Hexagon` ungültig und führt zu einem Compilerfehler.

---

### Frage 2: Paket- und Modul-Einschränkungen bei Sealed Classes
Gegeben sind die folgende Dateistruktur und Deklarationen:
`package com.geometry;`
`public sealed class Shape permits com.shapes.Circle {}`

`package com.shapes;`
`public final class Circle extends com.geometry.Shape {}`
Angenommen, dies ist KEINE modulare Java-Anwendung (keine `module-info.java`), wie lautet das Ergebnis der Kompilierung?
- A. Kompiliert erfolgreich.
- B. Compilerfehler, da erlaubte Unterklassen im selben Paket wie die versiegelte Klasse liegen müssen.
- C. Compilerfehler, da `Circle` Paket-Zugriffsschutz (package-private) verwenden muss.
- D. Compilerfehler, da `com.shapes.Circle` nicht importiert ist.

**Antwort: B**
**Ausführliche Erklärung:**
- In einer nicht-modularen Java-Anwendung müssen sich alle erlaubten Unterklassen einer `sealed`-Klasse **im exakt selben Paket** wie die versiegelte Klasse befinden.
- Da sich `Shape` in `com.geometry` und `Circle` in `com.shapes` befinden, verstößt dies gegen diese Paket-Einschränkung.
- Der Compiler weist den Code mit einem Fehler ab.
- *(Hinweis: Handelte es sich um eine modulare Anwendung mit dem Java Platform Module System, dürften die erlaubten Unterklassen in verschiedenen Paketen liegen, müssten sich jedoch weiterhin im selben **Modul** befinden).*

---

### Frage 3: Die Zuweisungsfalle im kompakten Konstruktor
Wie lautet das Ergebnis der Kompilierung der folgenden Java-Record-Deklaration?
```java
public record Student(String name, int score) {
    public Student {
        if (score < 0) {
            throw new IllegalArgumentException("Score cannot be negative");
        }
        this.score = score; // Line 6
    }
}
```
- A. Kompiliert erfolgreich.
- B. Compilerfehler in Zeile 6.
- C. Kompiliert, wirft aber eine RuntimeException.
- D. Compilerfehler, da kompakte Konstruktoren keine Validierungslogik enthalten dürfen.

**Antwort: B**
**Ausführliche Erklärung:**
- Ein **kompakter Konstruktor** (Compact Constructor) in einem Record hat keine Parameter und keine Klammern.
- Sein Hauptzweck besteht darin, Parameter zu validieren oder zu normalisieren, bevor sie den finalen Instanzfeldern des Records zugewiesen werden.
- Innerhalb eines kompakten Konstruktors sind die Parameter implizit verfügbar, aber eine **explizite Zuweisung zu den Instanzfeldern (mittels `this.feld = ...`) ist strengstens verboten**.
- Der Compiler fügt die Feldzuweisungen (`this.name = name; this.score = score;`) automatisch ganz am Ende des Blocks des kompakten Konstruktors ein.
- Da Zeile 6 versucht, `this.score = score;` manuell zuzuweisen, wirft der Compiler einen Fehler: `cannot assign a value to final variable score` (oder ein Äquivalent, das darauf hinweist, dass Feldzuweisungen in kompakten Konstruktoren unzulässig sind).
- Um dies zu beheben, entfernen Sie einfach Zeile 6. Die Normalisierung oder Validierung aktualisiert die Parameter, welche anschließend automatisch zugewiesen werden.

---

### Frage 4: Regeln für überladene Konstruktoren in Records
Gegeben ist die folgende Record-Definition:
```java
public record Point(int x, int y) {
    public Point(int val) {
        // Line 3
    }
}
```
Welche der folgenden Zeilen muss in Zeile 3 eingefügt werden, damit der Record erfolgreich kompiliert wird?
- A. `this.x = val; this.y = val;`
- B. `x = val; y = val;`
- C. `this(val, val);`
- D. Es ist kein Code erforderlich; der Compiler übernimmt die Standardzuweisung.

**Antwort: C**
**Ausführliche Erklärung:**
- Ein Record generiert automatisch einen **kanonischen Konstruktor** (Canonical Constructor), der seinen Komponenten entspricht: `public Point(int x, int y)`.
- Wenn Sie einen **überladenen Konstruktor** (einen Konstruktor mit einer anderen Parameterliste) in einem Record deklarieren:
  - Der überladene Konstruktor **muss in seiner allerersten Zeile an den kanonischen Konstruktor (oder einen anderen überladenen Konstruktor) delegieren**.
  - Diese Delegation muss mittels `this(...)` erfolgen.
- **A und B sind falsch:** Sie können den finalen Feldern des Records in einem überladenen Konstruktor keine Werte direkt zuweisen.
- **C ist korrekt:** `this(val, val);` delegiert sauber an den kanonischen Konstruktor.

---

### Frage 5: Einschränkungen bei Felddeklarationen in Records
Welche der folgenden Felddeklarationen ist innerhalb des Rumpfes eines Java-Records erlaubt?
```java
public record Account(String id) {
    private final double balance = 0.0;        // Option A
    public static String bankName = "MyBank";   // Option B
    private int score;                         // Option C
    private static final int LIMIT = 100;      // Option D
}
```
- A. Option A und C
- B. Option B und D
- C. Option A, B und D
- D. Keine der Optionen ist erlaubt.

**Antwort: B**
**Ausführliche Erklärung:**
- Ein Record ist strikt als einfacher Datenträger konzipiert. Sein Zustand wird ausschließlich durch die in seinem Header deklarierten Komponenten definiert (z. B. `String id`).
- Daher ist es Records **verboten, zusätzliche Instanzvariablen (Felder) zu deklarieren**.
  - **Option A und C sind ungültig:** Sie versuchen, Instanzfelder zu deklarieren (`balance`, `score`), was zu Compilerfehlern führt.
- Records **dürfen jedoch statische Variablen deklarieren** (sowohl Konstanten als auch veränderliche statische Variablen).
  - **Option B und D sind gültig:** Sie deklarieren statische Felder (`bankName`, `LIMIT`), was erfolgreich kompiliert wird.

---

### Frage 6: Vererbungsregeln für Records
Welche der folgenden Record-Deklarationen kompiliert erfolgreich?
- A. `public record ChildRecord(String name) extends ParentClass {}`
- B. `public record ChildRecord(String name) implements Serializable {}`
- C. `public abstract record ChildRecord(String name) {}`
- D. `public record ChildRecord(String name) extends Record {}`

**Antwort: B**
**Ausführliche Erklärung:**
- **A ist falsch:** Records erben implizit von `java.lang.Record`. Da Java keine Mehrfachklassenvererbung unterstützt, **kann ein Record keine andere Klasse erweitern**.
- **B ist korrekt:** Obwohl Records keine anderen Klassen erweitern können, **können sie beliebig viele Interfaces implementieren** (z. B. `implements Serializable`, `Runnable` etc.).
- **C ist falsch:** Records sind implizit **`final`**, da ihre Zustandsstruktur unveränderlich (immutable) ist. Sie können nicht als `abstract` deklariert werden.
- **D ist falsch:** Obwohl Records unter der Haube von `java.lang.Record` erben, darf `extends Record` nicht explizit in der Syntax verwendet werden.

---

### Frage 7: Gültigkeitsbereich beim Pattern Matching mit instanceof
Consider the following method:
```java
public void check(Object obj) {
    if (obj instanceof String s && s.length() > 5) {
        System.out.print(s.toLowerCase());
    } else {
        // Line 5
        // System.out.print(s); 
    }
}
```
Wenn Zeile 5 einkommentiert wird, wie lautet das Ergebnis?
- A. Der Code kompiliert und läuft erfolgreich.
- B. Compilerfehler, da `s` in Zeile 5 außerhalb des Gültigkeitsbereichs liegt.
- C. Compilerfehler, da `&&` nicht mit Pattern Matching verwendet werden darf.
- D. Wirft eine NullPointerException zur Laufzeit.

**Antwort: B**
**Ausführliche Erklärung:**
- Java verwendet einen flussbasierten Gültigkeitsbereich (**Flow Scoping**) für Pattern-Matching-Variablen (wie `s`).
- Die Pattern-Variable `s` is nur in den Codebereichen gültig, in denen der Compiler garantieren kann, dass die `instanceof`-Prüfung als `true` ausgewertet wurde.
- Im Ausdruck `obj instanceof String s && s.length() > 5`:
  - Wenn `obj instanceof String s` den Wert `false` liefert, wird die rechte Seite übersprungen (Kurzschlussauswertung / Short-Circuit). Wenn der Ausdruck `true` liefert, ist `s` für `s.length()` im Gültigkeitsbereich.
  - Im `if`-Block ist `s` im Gültigkeitsbereich, da die Bedingung wahr war.
  - Im `else`-Zweig war die Bedingung `false`. Das bedeutet, entweder war `obj` kein `String` oder seine Länge war nicht > 5. Da der Compiler nicht garantieren kann, dass `obj` ein `String` ist, ist `s` im `else`-Block **außerhalb des Gültigkeitsbereichs** (out of scope).
- Das Einkommentieren von Zeile 5 führt zu einem Compilerfehler: `cannot find symbol: variable s`.

---

### Frage 8: Die OR-Falle beim Gültigkeitsbereich von instanceof mit Pattern Matching
Welches der folgenden bedingten Patterns lässt sich nicht kompilieren?
- A. `if (obj instanceof String s && s.length() > 0)`
- B. `if (!(obj instanceof String s) || s.length() > 0)`
- C. `if (obj instanceof String s) { System.out.println(s); }`
- D. `if (!(obj instanceof String s)) { return; } else { System.out.println(s); }`

**Antwort: B**
**Ausführliche Erklärung:**
- **A kompiliert:** `&&` wertet kurzschlüssig aus. Wenn die linke Seite wahr ist, wird `s` initialisiert, wodurch `s.length()` auf der rechten Seite gültig ist.
- **B lässt sich nicht kompilieren:** Es wird der logische ODER-Operator `||` verwendet. Wenn die linke Seite `!(obj instanceof String s)` den Wert `false` hat (was bedeutet, dass `obj` ein `String` *ist*), muss die rechte Seite `s.length()` ausgewertet werden.
- Wenn die linke Seite jedoch zu `true` evaluiert (was bedeutet, dass `obj` *kein* String ist), wird die rechte Seite zwar übersprungen, der Compiler muss jedoch die Gültigkeitsregeln zur Kompilierzeit statisch überprüfen. Da `s` nicht initialisiert wäre, wenn `obj` kein String ist, deklariert der Compiler `s` für den ODER-Ausdruck als außerhalb des Gültigkeitsbereichs liegend, was zu einem Compilerfehler führt.
- **C kompiliert:** Standard-Blockgültigkeitsbereich.
- **D kompiliert:** Wenn `obj` kein String ist, kehrt die Methode zurück (`return`). Im `else`-Block ist somit garantiert, dass `obj` ein String ist, weshalb `s` dort im Gültigkeitsbereich liegt.

---

### Frage 9: Pattern-Dominanz in switch-Anweisungen (erreichbare Cases)
Gegeben ist die folgende switch-Anweisung in Java 21:
```java
public void process(Object obj) {
    switch (obj) {
        case CharSequence cs -> System.out.print("CS ");
        case String s -> System.out.print("String ");
        default -> System.out.print("Other ");
    }
}
```
Wie lautet das Ergebnis der Kompilierung dieses Codes?
- A. Kompiliert erfolgreich.
- B. Compilerfehler, da `CharSequence` ein Interface ist und nicht gematcht werden kann.
- C. Compilerfehler, da der `String`-Case vom `CharSequence`-Case dominiert wird.
- D. Wirft zur Laufzeit eine ClassCastException, wenn ein String übergeben wird.

**Antwort: C**
**Ausführliche Erklärung:**
- Der Compiler überprüft die Reihenfolge der Patterns in einer `switch`-Anweisung, um unerreichbaren Code zu verhindern.
- Da `String` das Interface `CharSequence` implementiert, würde jedes Objekt, das auf `case String s` passt, bereits auf den vorhergehenden Zweig `case CharSequence cs` zutreffen.
- Daher kann der Case `case String s` niemals erreicht werden. Dies wird als **Pattern-Dominanz** (Pattern Domination) bezeichnet.
- Der Compiler markiert dies als Fehler: `this case label is dominated by a preceding case label` (dieses Case-Label wird von einem vorherigen Case-Label dominiert).
- Um dies zu beheben, muss der spezifischere Unterklassen-Case (`String`) **vor** dem allgemeineren Elternklassen-Case (`CharSequence`) platziert werden.

---

### Frage 10: Guard-Patterns (das Schlüsselwort `when`)
Gegeben ist der folgende switch-Ausdruck in Java 21:
```java
public static String evaluate(Object obj) {
    return switch (obj) {
        case String s when s.length() > 5 -> "Long String";
        case String s -> "Short String";
        default -> "Other";
    };
}
```
Kompiliert dieser Code und wenn ja, was gibt `evaluate("Java21")` zurück?
- A. Compilerfehler, da `when` kein Schlüsselwort ist.
- B. Kompiliert erfolgreich und gibt `"Long String"` zurück.
- C. Kompiliert erfolgreich und gibt `"Short String"` zurück.
- D. Compilerfehler, da beide Cases auf `String` matchen.

**Antwort: B**
**Ausführliche Erklärung:**
- Java 21 unterstützt **Guard-Patterns** (Guarded Patterns) unter Verwendung des kontextabhängigen Schlüsselworts **`when`**.
- Guard-Patterns ermöglichen das Hinzufügen eines booleschen Ausdrucks zu einem Pattern-Case (z. B. `case String s when s.length() > 5`).
- Das Pattern matcht nur dann, wenn die Typprüfung erfolgreich ist **und** der boolesche Ausdruck als `true` ausgewertet wird.
- In diesem Code ist `"Java21"` ein `String` der Länge 6.
- Der erste Case prüft, ob die Länge > 5 ist, was `true` ergibt. Der Ausdruck gibt `"Long String"` zurück.
- Der Code kompiliert einwandfrei. Beachten Sie, dass das Platzieren von `case String s` *vor* `case String s when s.length() > 5` zu einem Compilerfehler wegen Dominanz führen würde, da der ungeschützte Case alle Strings abfangen würde.

---

### Frage 11: Switch-Patterns und Vollständigkeit (Exhaustiveness)
Gegeben sind das folgende versiegelte Interface (sealed interface) und der switch-Ausdruck:
```java
sealed interface Device permits Phone, Laptop {}
final class Phone implements Device {}
final class Laptop implements Device {}

public class SwitchExhaustive {
    public static int getPower(Device d) {
        return switch (d) {
            case Phone p -> 5;
            case Laptop l -> 45;
        };
    }
}
```
Welche der folgenden Aussagen über den switch-Ausdruck ist wahr?
- A. Compilerfehler, da ein `default`-Case fehlt.
- B. Compilerfehler, da `switch`-Ausdrücke keine Interfaces matchen können.
- C. Kompiliert erfolgreich, da der Switch für das versiegelte Interface `Device` vollständig (exhaustive) ist.
- D. Wirft eine RuntimeException, wenn eine neue Geräteklasse hinzugefügt wird.

**Antwort: C**
**Ausführliche Erklärung:**
- Ein `switch`-Ausdruck muss **vollständig** sein (er muss alle möglichen Eingabewerte abdecken).
- Wenn der Selektor-Ausdruck ein **versiegelter Typ** (wie `Device`) ist, weiß der Compiler, dass die einzig möglichen Implementierungen `Phone` und `Laptop` sind.
- Da beide erlaubten Unterklassen in den `case`-Blöcken abgedeckt sind, bestätigt der Compiler, dass der Switch vollständig (exhaustive) ist.
- Ein `default`-Case ist in diesem Szenario **nicht erforderlich**. Der Code kompiliert erfolgreich.
- *(Hinweis: Wäre `Device` ein normales, nicht versiegeltes Interface, würde der Compiler den Code ablehnen, da andere Klassen `Device` implementieren könnten, was einen `default`-Case erforderlich machen würde).*

---

### Frage 12: Dekonstruktionssyntax bei Record-Patterns
Gegeben ist der folgende Record:
`public record Point(int x, int y) {}`
Welche der folgenden `instanceof`-Patterns dekonstruieren den Record korrekt? (Wählen Sie alle zutreffenden Antworten aus)
- A. `if (obj instanceof Point(int x, int y))`
- B. `if (obj instanceof Point(var x, var y))`
- C. `if (obj instanceof Point(double x, double y))`
- D. `if (obj instanceof Point)`

**Antwort: A, B, D**
**Ausführliche Erklärung:**
- **A ist korrekt:** Verwendet explizite Typen, die den Record-Komponenten entsprechen (`int x`, `int y`).
- **B ist korrekt:** Verwendet `var`-Typinferenz. Der Compiler leitet `var x` als `int` und `var y` as `int` ab.
- **C ist falsch:** Die dekonstruierten Typen müssen mit den Record-Komponenten zuweisungskompatibel sein. Sie können eine `int`-Komponente nicht direkt in einen `double`-Pattern-Parameter dekonstruieren.
- **D ist korrekt:** Dies ist ein standardmäßiger Typ-Pattern-Match (keine Dekonstruktion), was ebenfalls gültig ist.

---

### Frage 13: Verschachtelte Record-Patterns (Java 21)
Gegeben sind die folgenden Record-Deklarationen:
```java
public record Point(int x, int y) {}
public record Rectangle(Point topLeft, Point bottomRight) {}
```
Welches der folgenden Matches ist ein gültiges **verschachteltes Record-Pattern** (nested Record Pattern), um die Koordinate `x` des oberen linken Punktes (top-left) eines `Rectangle`-Objekts zu extrahieren?
- A. `if (obj instanceof Rectangle(Point(int x, int y), Point br))`
- B. `if (obj instanceof Rectangle(Point topLeft(int x, int y), Point bottomRight))`
- C. `if (obj instanceof Rectangle(Point(int x), Point(int y)))`
- D. `if (obj instanceof Rectangle(int x1, int y1, int x2, int y2))`

**Antwort: A**
**Ausführliche Erklärung:**
- Java 21 unterstützt das Verschachteln von Record-Patterns in anderen Record-Patterns.
- `Rectangle` hat die Komponenten `Point topLeft` und `Point bottomRight`.
- **A ist korrekt:** Es dekonstruiert `topLeft` in ein verschachteltes Pattern `Point(int x, int y)` und matcht die zweite Komponente `bottomRight` as normales Typ-Pattern `Point br`. Die Variable `x` extrahiert die x-Koordinate von oben links.
- **B ist falsch:** Sie können in dieser Syntax keine Parameternamendeklarationen mit verschachtelten Patterns innerhalb der Klammern mischen.
- **C ist falsch:** `Point` hat zwei Komponenten, daher muss das verschachtelte `Point`-Pattern zwei Argumente deklarieren (`Point(int x, int y)`) und nicht nur eines.
- **D ist falsch:** Sie müssen die Record-Strukturen matchen; Sie können die Komponenten nicht flach klopfen (flatten).

---

### Frage 14: Syntax von Record-Accessoren
Gegeben ist die Record-Instanz:
`Student s = new Student("Alice", 95);`
Wie greifen Sie auf den Wert der Komponente `name` von `s` zu?
- A. `s.getName()`
- B. `s.name`
- C. `s.name()`
- D. `s.get("name")`

**Antwort: C**
**Ausführliche Erklärung:**
- Der Compiler generiert automatisch öffentliche Accessor-Methoden für Record-Komponenten.
- Im Gegensatz zu traditionellen JavaBeans, die Get-Präfixe verwenden (wie `getName()`), haben Record-Accessoren **exakt denselben Namen wie die Komponente** (`name()`).
- Daher ist C korrekt.

---

### Frage 15: Initialisierung statischer Felder in Records
Wie lautet die Ausgabe der folgenden Record-Anwendung?
```java
public record Counter(int id) {
    public static int count = 0;
    public Counter {
        count++;
    }
    public static void main(String[] args) {
        new Counter(1);
        new Counter(2);
        System.out.println(Counter.count);
    }
}
```
- A. `0`
- B. `2`
- C. Compilerfehler, da Records keine statischen Variablen enthalten dürfen.
- D. Compilerfehler, da Records keine main-Methoden deklarieren dürfen.

**Antwort: B**
**Ausführliche Erklärung:**
- Records können statische Variablen, statische Blöcke, statische Methoden und einen `main`-Einstiegspunkt definieren.
- Der kompakte Konstruktor inkrementiert die statische Variable `count` jedes Mal, wenn eine Instanz von `Counter` erstellt wird.
- Es werden zwei Instanzen erstellt, wodurch `count` auf `2` erhöht wird.
- Ausgabe: `2`.

---

### Frage 16: Unveränderlichkeit von Record-Feldern
Wie lautet das Ergebnis der Kompilierung des folgenden Record-Codes?
```java
public record Mutator(StringBuilder data) {
    public void change() {
        data.append("Modified");
    }
}
```
- A. Compilerfehler, da Records unveränderlich sind und ihre Felder nicht geändert werden können.
- B. Kompiliert erfolgreich; dies zeigt, dass zwar die Referenzen in einem Record final sind, die Objekte, auf die sie verweisen, jedoch weiterhin modifiziert werden können (flache Unveränderlichkeit / Shallow Immutability).
- C. Compilerfehler, da Records keine benutzerdefinierten Instanzmethoden deklarieren dürfen.
- D. Wirft eine Exception zur Laufzeit.

**Antwort: B**
**Ausführliche Erklärung:**
- Record-Komponenten werden als `private final`-Felder deklariert.
- Dies erzwingt die **Referenz-Unveränderlichkeit**: Das Feld `data` kann nicht neu zugewiesen werden, um auf eine andere `StringBuilder`-Instanz zu zeigen.
- Das von `data` referenzierte Objekt ist jedoch eine veränderliche (mutable) `StringBuilder`-Instanz. Der Aufruf von `data.append(...)` verändert den internen Zustand dieses Objekts.
- Daher garantieren Records nur eine **flache Unveränderlichkeit** (Shallow Immutability).
- Der Code kompiliert und läuft erfolgreich.

---

### Frage 17: Versiegelte Interfaces und erlaubte Unterklassen als Enums
Kann ein Java-`enum` ein versiegeltes Interface (sealed interface) implementieren?
```java
sealed interface Status permits Phase {}
enum Phase implements Status { START, RUNNING, END }
```
- A. Nein, `enum`-Typen können keine Interfaces implementieren.
- B. Ja, da `enum`-Typen implizit final sind und somit die Modifikatoreinschränkung für Unterklassen versiegelter Typen erfüllen.
- C. Nein, nur Klassen und Interfaces können erlaubte Unterklassen versiegelter Typen sein.
- D. Ja, aber nur, wenn das Enum als `final enum` deklariert ist.

**Antwort: B**
**Ausführliche Erklärung:**
- Versiegelte Interfaces können `enum`-Typen erlauben (permits).
- Unter der Haube wird ein `enum` als Klasse kompiliert, die von `java.lang.Enum` erbt.
- Da Enums implizit final sind (oder sealed, wenn sie konstantenspezifische Klassenrümpfe enthalten), erfüllen sie die Anforderung, dass jede erlaubte Unterklasse eines versiegelten Typs entweder `final`, `sealed` oder `non-sealed` sein muss.
- Der Code kompiliert erfolgreich.

---

### Frage 18: Record-Patterns mit Null-Referenzen
Wie lautet das Ergebnis der Ausführung der folgenden Methode in Java 21?
```java
public record User(String name) {}

public static void checkUser(Object obj) {
    if (obj instanceof User(var name)) {
        System.out.print("User: " + name);
    } else {
        System.out.print("NoUser");
    }
}

public static void main(String[] args) {
    checkUser(null);
}
```
- A. Wirft eine `NullPointerException` zur Laufzeit.
- B. Prints `User: null`
- C. Prints `NoUser`
- D. Fails to compile.

**Antwort: C**
**Ausführliche Erklärung:**
- Der `instanceof`-Operator liefert `false`, wenn die geprüfte Referenz `null` ist.
- Diese Regel gilt gleichermaßen für Standard-Typ-Patterns und **Record-Patterns**.
- Da `obj` hier `null` ist, wertet `obj instanceof User(var name)` zu `false` aus.
- Der Kontrollfluss verzweigt in den `else`-Block und gibt `"NoUser"` aus. Es wird keine Exception geworfen.

---

### Frage 19: Sealed Classes über verschiedene Quelldateien hinweg
Wenn eine versiegelte Klasse Unterklassen erlaubt, die in derselben **Quelldatei** definiert sind, welche der folgenden Aussagen ist wahr?
- A. Die `permits`-Klausel ist weiterhin zwingend erforderlich.
- B. Die `permits`-Klausel ist optional; der Compiler leitet die erlaubten Unterklassen automatisch ab.
- C. Die Unterklassen müssen als statisch deklariert werden.
- D. Die Unterklassen müssen als innere Klassen deklariert werden.

**Antwort: B**
**Ausführliche Erklärung:**
- Wenn alle erlaubten Unterklassen in derselben Quelldatei (derselben Übersetzungseinheit) wie die versiegelte Klasse deklariert sind:
  - Die `permits`-Klausel kann weggelassen werden.
  - Der Compiler scannt die Datei automatisch und leitet die Liste der erlaubten Unterklassen ab.
- Daher ist B korrekt.

---

### Frage 20: Pattern Matching in switch mit null-Case
Was gibt das folgende Switch-Pattern-Matching aus, wenn `null` übergeben wird?
```java
public static void process(Object obj) {
    switch(obj) {
        case String s -> System.out.print("String ");
        case null -> System.out.print("Null ");
        default -> System.out.print("Default ");
    }
}
```
- A. Wirft vor dem Matching eine `NullPointerException`.
- B. Gibt `Default ` aus.
- C. Gibt `Null ` aus.
- D. Compilerfehler, da `null` nicht als Case-Label verwendet werden darf.

**Antwort: C**
**Ausführliche Erklärung:**
- Traditionell führte die Übergabe von `null` an eine `switch`-Anweisung sofort zu einer `NullPointerException`.
- Im modernen Java (Java 21) können Sie Nullwerte explizit mit einem **`case null`**-Label behandeln.
- Wenn `obj` gleich `null` ist, verzweigt die Ausführung zum Match `case null` und gibt `"Null "` aus.
- Wenn `case null` weggelassen wird, löst die Übergabe von `null` an ein Pattern-Matching-Switch weiterhin eine `NullPointerException` aus (es sei denn, das einzige Pattern ist ein Total-Type-Pattern oder ein `default`-Zweig, der in manchen Kontexten Null nicht direkt prüft, aber `case null` ist der Standardweg zur Handhabung).
- Ausgabe: `Null `.

