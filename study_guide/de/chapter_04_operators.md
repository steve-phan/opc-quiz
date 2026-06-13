# Kapitel 4: Operatoren, Casting & Kontrollfluss-Entscheidungen

## 1. Core Java 21 Prüfungsziele
- Java-Operatoren anwenden, einschließlich arithmetischer, logischer, relationaler und ternärer Operatoren.
- Operatorpräzedenz (Rangordnung) und Kurzschluss-Auswertung (Short-Circuit Evaluation) verstehen.
- JVM-Regeln zur numerischen Promotion und zum Casting beherrschen.
- Bedingten Kontrollfluss mit `if/else` und modernen `switch`-Ausdrücken implementieren.

---

## 2. Detaillierte Konzepte

### Operatorpräzedenz & Kurzschluss-Auswertung (Short-Circuiting)
Die Reihenfolge, in der Operationen ausgewertet werden, wird durch die Präzedenz (Rangordnung) bestimmt. Operatoren auf derselben Ebene werden von links nach rechts ausgewertet (mit Ausnahme von Zuweisungs- und unären Operatoren, die von rechts nach links ausgewertet werden).

#### Kurzschluss-Operatoren:
- `&&` (Logisches UND): Wenn die linke Seite zu `false` ausgewertet wird, wird die rechte Seite komplett übersprungen, da das Gesamtergebnis ohnehin false sein muss.
- `||` (Logisches ODER): Wenn die linke Seite zu `true` ausgewertet wird, wird die rechte Seite übersprungen.
- *OCP-Falle:* Standardmäßige logische Operatoren (`&`, `|`) führen *keine* Kurzschluss-Auswertung durch. Sie werten immer beide Seiten aus, was zu Laufzeit-Exceptions (z. B. `NullPointerException`) führen kann, wenn sie nicht sorgfältig behandelt werden.

### JVM-Regeln zur numerischen Promotion
Bei der Ausführung von binären arithmetischen Operationen promotet (erhöht) die JVM automatisch kleinere Operanden, um sie an die Größe des größeren Operanden anzupassen:
1. **Regel 1 (Die `int`-Promotion):** Wenn zwei Werte unterschiedliche Datentypen haben, promotet Java automatisch den kleineren zum größeren Typ. Jede binäre Operation, an der `byte`, `short` oder `char` beteiligt sind, promotet die Operanden jedoch immer zuerst zu `int`, selbst wenn keiner der Operanden ein `int` ist!
2. **Regel 2:** Wenn einer der Operanden ein `double` ist, wird der andere zu `double` promotet.
3. **Regel 3:** Wenn einer der Operanden ein `float` ist, wird der andere zu `float` promotet.
4. **Regel 4:** Wenn einer der Operanden ein `long` ist, wird der andere zu `long` promotet.

*OCP-Falle:* Aufgrund von Regel 1 schlägt die Kompilierung des folgenden Codes fehl:
```java
short x = 5;
short y = 10;
short z = x + y; // Kompilierfehler! x + y wird zu int promotet.
```

### Zusammengesetzte Zuweisungsoperatoren (Compound Assignment)
Zusammengesetzte Zuweisungsoperatoren (z. B. `+=`, `*=`, `-=`) enthalten einen **impliziten Cast**.
- `x += y` ist äquivalent zu `x = (type)(x + y)`.
- Das bedeutet, dass Sie Folgendes schreiben können:
  ```java
  short x = 5;
  x += 10; // Kompiliert erfolgreich! Äquivalent zu x = (short)(x + 10).
  ```

### Moderne `switch`-Ausdrücke (Expressions)
Java 14 führte den `switch`-Ausdruck ein, der in Java 21 weiter verfeinert wurde. Er kann einen Wert zurückgeben und leidet nicht unter Fall-Through-Fehlern.

#### Regeln für switch-Ausdrücke:
1. **Pfeil-Syntax (`->`):** Verhindert Fall-Through. Nur der passende Zweig wird ausgeführt.
2. **Vollständigkeit (Exhaustiveness):** Muss alle möglichen Werte abdecken. Wenn über einen Nicht-Enum-Typ oder ein Enum mit nicht abgedeckten Werten geswitcht wird, ist ein `default`-Zweig zwingend erforderlich.
3. **Wertrückgabe:** Wenn ein Wert zurückgegeben wird, muss jeder Zweig einen Wert liefern.
4. **Das Schlüsselwort `yield`:** Wird verwendet, um einen Wert aus einem mehrzeiligen Case-Block zurückzugeben.

---

## 3. JVM-Interna & Speicherlayout

### Bytecode-Ansicht von Compound Assignment
Schauen wir uns an, wie die JVM zusammengesetzte Zuweisungen auf Bytecode-Ebene darstellt.
Betrachten wir:
```java
byte b = 2;
b *= 3;
```
Der kompilierte Bytecode für `b *= 3` sieht wie folgt aus:
```bytecode
iload_1          // Lokale byte-Variable laden
iconst_3         // Konstante 3 auf den Stack legen
imul             // int-Multiplikation durchführen (zu int promotet)
i2b              // CAST zurück zu byte (implizite Konvertierung!)
istore_1         // Zurück in lokaler Variable 1 speichern
```
Beachten Sie den Befehl `i2b`. Dieser Befehl führt die explizite Kürzung (Truncation) zurück zu einem Byte durch. Dies verhindert Kompilierfehler, kann aber ohne Laufzeitwarnung zu einem numerischen Überlauf (Overflow) führen.

---

## 4. Tricky OCP Exam Questions

### Frage 1: Unäre Post-Inkrement- und Prä-Inkrement-Operatoren
Was ist die Ausgabe beim Ausführen des folgenden Code-Snippets?
```java
int a = 5;
int b = a++ + ++a * --a;
System.out.println("a=" + a + ", b=" + b);
```
- A. `a=6, b=47`
- B. `a=6, b=41`
- C. `a=6, b=35`
- D. `a=5, b=41`

**Answer: A**
**Detailed Explanation:**
Lassen Sie uns die Auswertung von `a++ + ++a * --a` Schritt für Schritt von links nach rechts nachvollziehen, unter Einhaltung der Operatorpräzedenz (Multiplikation hat eine höhere Priorität als Addition, aber die Operanden selbst werden von links nach rechts ausgewertet, wie sie im Ausdruck erscheinen).
- Anfangszustand: `a = 5`.
- **Schritt 1: Auswerten von `a++` (linker Operand der Addition)**
  - Dies verwendet den Post-Inkrement-Operator. Der Ausdruck wird zum *aktuellen* Wert von `a` ausgewertet, welcher `5` ist.
  - Unmittelbar nach der Auswertung wird `a` auf `6` inkrementiert.
  - Der Ausdruck sieht nun so aus: `5 + ++a * --a` (mit `a = 6`).
- **Schritt 2: Auswerten von `++a` (linker Operand der Multiplikation)**
  - Dies verwendet den Prä-Inkrement-Operator. `a` wird zuerst von `6` auf `7` inkrementiert.
  - Der Ausdruck wird zum neuen Wert von `a` ausgewertet, welcher `7` ist.
  - Der Ausdruck sieht nun so aus: `5 + 7 * --a` (mit `a = 7`).
- **Schritt 3: Auswerten von `--a` (rechter Operand der Multiplikation)**
  - Dies verwendet den Prä-Dekrement-Operator. `a` wird zuerst von `7` auf `6` dekrementiert.
  - Der Ausdruck wird zum neuen Wert von `a` ausgewertet, welcher `6` ist.
  - Der Ausdruck sieht nun so aus: `5 + 7 * 6` (mit `a = 6`).
- **Schritt 4: Arithmetische Berechnungen durchführen**
  - Multiplikation kommt zuerst: `7 * 6 = 42`.
  - Addition kommt als nächstes: `5 + 42 = 47`.
- Der endgültige Wert von `a` ist `6` (aufgrund des letzten Dekrements). Der Wert von `b` ist `47`.
- Ausgabe: `a=6, b=47`.

---

### Frage 2: Logische Operatoren und Nebeneffekte der Kurzschluss-Auswertung
Was ist der Endzustand der Variablen `x`, `y` und `z` nach dem Ausführen des folgenden Blocks?
```java
int x = 10;
int y = 20;
boolean z = false;

if ((x++ > 10) && (++y < 25) | (z = true)) {
    x += 2;
}
System.out.println("x=" + x + ", y=" + y + ", z=" + z);
```
- A. `x=13, y=20, z=true`
- B. `x=11, y=20, z=true`
- C. `x=13, y=21, z=true`
- D. `x=11, y=20, z=false`

**Answer: A**
**Detailed Explanation:**
Lassen Sie uns den bedingten Ausdruck zerlegen: `((x++ > 10) && (++y < 25) | (z = true))`
- **Teil 1: `(x++ > 10)` (linke Seite des Kurzschluss-`&&`)**
  - `x++` wird zu `10` ausgewertet (das Post-Inkrement erfolgt nach der Auswertung).
  - Der Vergleich `10 > 10` wird zu `false` ausgewertet.
  - Unmittelbar danach wird `x` auf `11` inkrementiert.
- **Teil 2: `(++y < 25)` (rechte Seite des Kurzschluss-`&&`)**
  - Da die linke Seite des `&&`-Operators zu `false` ausgewertet wurde, greift die **Kurzschluss**-Regel.
  - Der rechte Ausdruck `(++y < 25)` wird **nicht ausgeführt**. Daher bleibt `y` bei `20`.
  - Der gesamte logische UND-Ausdruck `((x++ > 10) && (++y < 25))` wird zu `false` ausgewertet.
- **Teil 3: `... | (z = true)` (bitweises/nicht-kurzschließendes ODER)**
  - Beachten Sie den Operator, der den UND-Ausdruck und die Zuweisung verbindet: Es ist `|` (nicht-kurzschließendes ODER), nicht `||` (Kurzschluss-ODER).
  - Das bitweise/logische ODER (`|`) **wertet immer beide Seiten aus**, unabhängig vom Ergebnis der linken Seite.
  - Daher wird der Ausdruck `(z = true)` ausgeführt. Dies weist `z` den Wert `true` zu und wird selbst zu `true` ausgewertet.
  - Der Gesamtausdruck wird zu `false | true` aufgelöst, was `true` ergibt.
- **Teil 4: Ausführen des if-Rumpfs**
  - Da die Bedingung `true` ist, wird der Rumpf `x += 2` ausgeführt.
  - Da `x` im ersten Schritt auf `11` inkrementiert wurde, aktualisiert das Ausführen von `x += 2` den Wert von `x` auf `13`.
  - Daher ist die korrekte Option **A**.

---

### Frage 3: Modulo-Operator mit negativen Zahlen
Was ist das Ergebnis der Auswertung der Ausdrücke `5 % -3` und `-5 % 3` in Java?
- A. `2` und `-2`
- B. `-2` und `-2`
- C. `2` und `2`
- D. `-2` und `2`

**Answer: A**
**Detailed Explanation:**
In Java wird das Vorzeichen des Ergebnisses des Restwert-/Modulo-Operators `%` **immer durch das Vorzeichen des Dividenden (des linken Operanden) bestimmt**, unabhängig vom Vorzeichen des Divisors (des rechten Operanden).
- Für `5 % -3`: Der Dividend ist positiv (`5`), also ist das Ergebnis positiv: `2`.
- Für `-5 % 3`: Der Dividend ist negativ (`-5`), also ist das Ergebnis negativ: `-2`.
- Daher sind die Ausgabewerte `2` und `-2`.

---

### Frage 4: Numerische Promotion beim ternären Operator
Betrachten Sie die folgende Deklaration:
```java
int status = 10;
var value = (status < 20) ? 5 : 2.0;
```
Was ist der Compile-Time-Typ (Typ zur Kompilierzeit) der Variable `value`?
- A. `int`
- B. `double`
- C. `Double`
- D. Kompiliert nicht, da die Zweige des ternären Operators unterschiedliche Typen zurückgeben.

**Answer: B**
**Detailed Explanation:**
Der Compiler muss zur Kompilierzeit einen einzigen, einheitlichen Typ für den ternären Ausdruck bestimmen, welcher dann der Variable zugewiesen wird (oder zur Typinferenz von `var` verwendet wird).
- Die beiden Auswertungszweige sind `5` (ein `int`) und `2.0` (ein `double`).
- Nach den Regeln der numerischen Promotion in Java wird der `int`-Wert zu `double` promotet, wenn ein Operand ein `int` und der andere ein `double` ist.
- Daher wird der ternäre Ausdruck zu einem `double` ausgewertet.
- `var` inferiert den Typ von `value` als den primitiven Typ `double`.

---

### Frage 5: Zuweisungsoperator als Ausdruck
Was ist die Ausgabe bei der Ausführung des folgenden Programms?
```java
public class AssignTest {
    public static void main(String[] args) {
        boolean b = false;
        if (b = true) {
            System.out.println("Success");
        } else {
            System.out.println("Failure");
        }
    }
}
```
- A. `Success`
- B. `Failure`
- C. Kompiliert nicht, da `b = true` den Zuweisungsoperator anstelle des Gleichheitsoperators (`==`) verwendet.
- D. Wirft zur Laufzeit eine ClassCastException.

**Answer: A**
**Detailed Explanation:**
Eine sehr häufige OCP-Prüfungsfalle is die Verwendung eines einfachen Gleichheitszeichens `=` (Zuweisung) anstelle eines doppelten Gleichheitszeichens `==` (Gleichheitsvergleich) in einer `if`- oder `while`-Bedingung.
- In Java ist eine Zuweisung auch ein Ausdruck, der zu dem zugewiesenen Wert ausgewertet wird.
- `b = true` weist `b` den Wert `true` zu und wird selbst als `true` ausgewertet.
- Da der Ausdruck zu einem booleschen Wert (`true`) ausgewertet wird, ist er syntaktisch innerhalb der `if`-Bedingung gültig. Der Code kompiliert fehlerfrei.
- Zur Laufzeit wird die Bedingung als `true` ausgewertet und das Programm gibt `"Success"` aus.
- *(Hinweis: Wenn der Variablentyp nicht boolesch wäre, z. B. `int x = 0; if (x = 5)`, würde die Kompilierung fehlschlagen, da der resultierende Typ `int` nicht in einen `boolean` konvertiert werden kann)*.

---

### Frage 6: Gleichheit von Double.NaN
Was gibt das folgende Snippet aus?
```java
double value1 = Double.NaN;
double value2 = Double.NaN;
System.out.println((value1 == value2) + " " + Double.isNaN(value1));
```
- A. `true true`
- B. `false true`
- C. `true false`
- D. `false false`

**Answer: B**
**Detailed Explanation:**
`Double.NaN` (Not a Number) stellt ein undefiniertes Gleitkommaergebnis dar (z. B. `0.0 / 0.0`).
- Nach der Definition im IEEE-754-Gleitkommastandard ist **NaN niemals gleich irgendeinem Wert, einschließlich sich selbst**.
- Daher liefert der Wertevergleich `value1 == value2` (die Auswertung von `NaN == NaN`) `false` zurück.
- Um zu überprüfen, ob eine Variable den Wert NaN hat, müssen Sie die statische Methode `Double.isNaN(double)` oder die Instanzmethode `Double.valueOf(val).equals(Double.NaN)` verwenden (welche `true` zurückgibt).
- Ausgabe: `false true`.

---

### Frage 7: Vorzeichenloser Rechtsshift-Operator
Was ist das Ergebnis des Ausdrucks `-8 >>> 1` im Vergleich zu `-8 >> 1`?
- A. Beide Ausdrücke liefern `-4`.
- B. `-8 >> 1` liefert `-4`, während `-8 >>> 1` eine große positive Ganzzahl liefert.
- C. Beide Ausdrücke führen zu einem arithmetischen Fehler zur Kompilierzeit.
- D. `-8 >>> 1` liefert `4` und `-8 >> 1` liefert `-4`.

**Answer: B**
**Detailed Explanation:**
Der Operator `>>` ist der **vorzeichenbehaftete Rechtsshift-Operator** (arithmetischer Rechtsshift). Er behält das Vorzeichenbit (das am weitesten links stehende Bit) bei, indem er leere Stellen links mit `1` auffüllt, wenn die Zahl negativ ist, oder mit `0`, wenn sie positiv ist. `-8 >> 1` ergibt `-4`.
- Der Operator `>>>` ist der **vorzeichenlose Rechtsshift-Operator** (logischer Rechtsshift). Er füllt leere Bits links immer mit `0` auf, unabhängig davon, ob das Vorzeichenbit `1` oder `0` war.
- Bei einer negativen Zahl wie `-8` (deren Binärdarstellung ein führendes `1`-Vorzeichenbit hat) verschiebt der vorzeichenlose Rechtsshift eine `0` in das Vorzeichenbit, wodurch die negative Zahl in eine große positive Ganzzahl (`2.147.483.644`) umgewandelt wird.
- Daher ist B korrekt.

---

### Frage 8: Bitweiser Komplement-Operator
Was ist die Ausgabe der folgenden Anweisung?
```java
int x = 10;
System.out.println(~x);
```
- A. `-10`
- B. `-11`
- C. `9`
- D. `-9`

**Answer: B**
**Detailed Explanation:**
Der bitweise Komplement-Operator `~` invertiert alle Bits einer Ganzzahl (macht aus 0en 1en und aus 1en 0en).
- In der Zweierkomplement-Binärarithmetik ist das bitweise Komplement jeder Ganzzahl `n` gleich **`-n - 1`**.
- Für `x = 10` ist `~10` äquivalent zu `-10 - 1 = -11`.
- Daher ist die Ausgabe `-11`.

---

### Frage 9: Präzedenz bei zusammengesetzten Zuweisungen
Was ist der Wert von `x` nach der Ausführung dieses Codes?
```java
int x = 2;
x *= 3 + 2;
```
- A. `8`
- B. `10`
- C. `7`
- D. Kompiliert aufgrund von Typ-Promotion nicht.

**Answer: B**
**Detailed Explanation:**
Der zusammengesetzte Zuweisungsoperator `*=` hat eine der **niedrigsten Präzedenzen** aller Operatoren.
- Nur die Zuweisungsoperatoren (`=`, `+=`, `*=`, etc.) haben eine noch niedrigere Priorität.
- Dies bedeutet, dass der gesamte Ausdruck auf der rechten Seite von `*=` zuerst ausgewertet wird, so als ob er in Klammern stünde: `x *= (3 + 2)`.
- `3 + 2` wird zu `5` ausgewertet.
- Dann wird `x *= 5` ausgeführt, was zu `x = x * 5` führt und zu `2 * 5 = 10` ausgewertet wird.
- Die Ausgabe ist `10`.

---

### Frage 10: Syntaxregeln für switch-Ausdrücke
Welche der folgenden modernen `switch`-Konstrukte kompilieren erfolgreich? (Wählen Sie alle zutreffenden aus)
```java
// Option I
int status = 1;
int val = switch(status) {
    case 1 -> 10;
    default -> 20;
};

// Option II
int status = 1;
int val = switch(status) {
    case 1: yield 10;
    default: yield 20;
};

// Option III
int status = 1;
int val = switch(status) {
    case 1 -> { yield 10; }
    default -> 20;
};

// Option IV
int status = 1;
int val = switch(status) {
    case 1 -> 10;
    default: yield 20; // Mixed syntax
};
```
- A. Nur Option I und II
- B. Nur Option I, II und III
- C. Nur Option I und III
- D. Alle Optionen kompilieren erfolgreich.

**Answer: B**
**Detailed Explanation:**
- **Option I (Gültig):** Verwendet die Pfeil-Syntax `->`. Da es sich um einen einzelnen Ausdruck handelt, sind keine geschweiften Klammern oder `yield` erforderlich.
- **Option II (Gültig):** Verwendet die traditionelle Doppelpunkt-Syntax `case 1:`. In `switch`-*Ausdrücken* müssen Sie `yield` verwenden, um einen Wert zurückzugeben, anstatt `break`.
- **Option III (Gültig):** Verwendet die Pfeil-Syntax in Kombination mit einem Block `{ ... }`. Innerhalb eines Blocks muss `yield` verwendet werden, um den Wert zurückzugeben. Der `default`-Zweig verwendet den kurzen, einfachen Ausdruck. Das Mischen von Block- und Ausdrucksstilen mit Pfeilen ist zulässig.
- **Option IV (Ungültig):** Das Mischen von Pfeil-Syntax (`->`) und Doppelpunkt-Syntax (`:`) innerhalb desselben `switch`-Ausdrucks ist vom Compiler strengstens untersagt. Dies führt zu einem Kompilierfehler.

---

### Frage 11: Fall-Through bei Switch-Anweisungen
Was gibt die folgende Switch-Anweisung bei der Ausführung aus?
```java
int value = 2;
switch (value) {
    case 1:
        System.out.print("1 ");
    case 2:
        System.out.print("2 ");
    case 3:
        System.out.print("3 ");
    default:
        System.out.print("D");
}
```
- A. `2 `
- B. `2 3 D`
- C. `2 3 `
- D. Kompiliert nicht, da in der switch-Anweisung break-Anweisungen fehlen.

**Answer: B**
**Detailed Explanation:**
Dies ist eine traditionelle `switch`-Anweisung (die Doppelpunkte `:` verwendet und keinen Wert zurückgibt).
- Im Gegensatz zu `switch`-Ausdrücken weisen traditionelle `switch`-Anweisungen ein **Fall-Through** (Durchfallen) auf, wenn `break`-Anweisungen weggelassen werden.
- Die Ausführung springt zu `case 2` und gibt `"2 "` aus.
- Da es kein `break` gibt, fällt die Ausführung zu `case 3` durch und gibt `"3 "` aus.
- Danach fällt sie in den `default`-Fall durch und gibt `"D"` aus.
- Ausgabe: `2 3 D`.

---

### Frage 12: Zuweisungskompatibilität beim ternären Operator
Welche der folgenden Deklarationen kompiliert nicht?
- A. `int x = true ? 10 : 20;`
- B. `short s = true ? 10 : 200000;`
- C. `short s = true ? 10 : 20;`
- D. `long y = true ? 10 : 20L;`

**Answer: B**
**Detailed Explanation:**
Bei ternären Ausdrücken prüft der Compiler, selbst wenn die Bedingung ein zur Kompilierzeit konstanter Ausdruck (wie `true`) ist, dennoch beide Zweige auf Zuweisungskompatibilität.
- In **B** ist der Wert `200000` ein `int`-Literal, das den Wertebereich eines `short` (`-32768` bis `32767`) überschreitet. Der Compiler kann diesen Wert nicht implizit auf einen `short` verkleinern (narrowing), was zu einem Kompilierfehler führt.
- In **C** passen sowohl `10` als auch `20` in den `short`-Bereich, sodass die implizite Verkleinerung erfolgreich ist.

---

### Frage 13: Standardtypen für Gleitkomma-Literale
Welche der folgenden Variablendeklarationen kompilieren fehlerfrei? (Wählen Sie alle zutreffenden aus)
- A. `float f1 = 1.0;`
- B. `float f2 = 1.0f;`
- C. `double d1 = 1.0;`
- D. `double d2 = 1.0f;`
- E. `float f3 = 1L;`

**Answer: B, C, D, E**
**Detailed Explanation:**
- **A ist falsch:** Das Literal `1.0` ist standardmäßig ein `double`. Sie können einer `float`-Variable kein `double` ohne expliziten Cast zuweisen.
- **B ist korrekt:** `1.0f` ist explizit ein `float`-Literal.
- **C ist korrekt:** `1.0` ist ein `double`-Literal.
- **D ist korrekt:** Ein `float`-Wert (`1.0f`) kann implizit zu einem `double` promotet werden (Erweiterungskonvertierung / Widening).
- **E ist korrekt:** Ein primitiver `long`-Wert (`1L`) kann implizit zu `float` promotet werden (obwohl `long` 64-Bit und `float` 32-Bit groß ist, hat `float` einen größeren Exponentenbereich, weshalb das Widening erlaubt ist).

---

### Frage 14: Vollständigkeit (Exhaustiveness) bei switch-Ausdrücken
Betrachten Sie das folgende Enum und den switch-Ausdruck:
```java
enum Season { WINTER, SPRING, SUMMER, FALL }

public class EnumSwitch {
    public static void main(String[] args) {
        Season s = Season.SUMMER;
        String activity = switch(s) {
            case WINTER -> "Skiing";
            case SUMMER -> "Swimming";
        };
    }
}
```
Warum kompiliert dieser Code nicht?
- A. Weil `enum`-Konstanten nicht in `switch`-Ausdrücken verwendet werden können.
- B. Weil `switch`-Ausdrücke ein `int` zurückgeben müssen.
- C. Weil der `switch`-Ausdruck nicht vollständig ist und `SPRING` sowie `FALL` nicht abdeckt.
- D. Weil in jedem Zweig eine `yield`-Anweisung fehlt.

**Answer: C**
**Detailed Explanation:**
`switch`-Ausdrücke (im Gegensatz zu `switch`-Anweisungen) müssen **vollständig** (exhaustive) sein. Das bedeutet, dass sie jeden möglichen Eingabewert des Selektor-Ausdrucks abdecken müssen.
- Für einen `enum`-Selektor müssen Sie entweder für jede definierte Enum-Konstante ein `case` oder einen `default`-Fall angeben.
- Da `SPRING` und `FALL` nicht zugeordnet sind und kein `default`-Fall existiert, wirft der Compiler einen Fehler: `the switch expression does not cover all possible input values` (der switch-Ausdruck deckt nicht alle möglichen Eingabewerte ab).

---

### Frage 15: Präzedenz des Cast-Operators
Was ist der Wert von `result` nach der Ausführung des folgenden Codes?
```java
double value = 9.9;
int result = (int) value * 2;
```
- A. `19`
- B. `18`
- C. `19.8`
- D. Kompiliert nicht.

**Answer: B**
**Detailed Explanation:**
Der Cast-Operator `(type)` hat eine **höhere Präzedenz** als die Multiplikation `*`.
- Daher wird der Cast `(int) value` zuerst ausgewertet, wodurch `9.9` zu `9` konvertiert wird.
- Danach wird `9 * 2` ausgewertet, was `18` ergibt.
- Wenn Sie zuerst multiplizieren oder runden wollten, müssten Sie den Ausdruck in Klammern setzen: `(int) (value * 2)`, was `19` ergeben würde.

---

### Frage 16: Relationale Operatoren mit inkompatiblen Typen
Welcher der folgenden relationalen Vergleiche kompiliert nicht?
- A. `boolean check = (10 == 10.0);`
- B. `boolean check = ("Java" == "Kotlin");`
- C. `boolean check = (10 < 20L);`
- D. `boolean check = ("Java" == 10);`

**Answer: D**
**Detailed Explanation:**
- **A ist korrekt:** Kompiliert erfolgreich, da primitive numerische Typen nach der Promotion wertmäßig verglichen werden (promotet `10` zu `10.0`).
- **B ist korrekt:** Kompiliert erfolgreich, da beide Operanden Referenzen desselben Klassentyps (`String`) sind.
- **C ist korrekt:** Kompiliert erfolgreich, da primitive numerische Typen für den Vergleich promotet werden (promotet `10` zu `10L`).
- **D ist falsch/kompiliert nicht:** Sie können Referenzen inkompatibler Typen (hier eine `String`-Referenz und ein primitiver `int`) nicht mit `==` vergleichen. Der Compiler erkennt diese Typinkompatibilität zur Kompilierzeit.

---

### Frage 17: Präzedenz des bedingten Operators bei Strings
Was gibt die folgende Anweisung aus?
```java
System.out.println("Output: " + (5 > 3 ? "Yes" : "No"));
```
- A. `Output: Yes`
- B. `Output: No`
- C. `Yes`
- D. Kompiliert aufgrund eines Klammerfehlers nicht.

**Answer: A**
**Detailed Explanation:**
Die Klammern `(5 > 3 ? "Yes" : "No")` erzwingen, dass der ternäre Operator zuerst ausgewertet wird.
- `5 > 3` wird zu `true` ausgewertet, sodass der ternäre Ausdruck zu `"Yes"` aufgelöst wird.
- Dieses Ergebnis wird mit `"Output: "` verkettet, was `"Output: Yes"` ergibt.
- *(Hinweis: Wenn die Klammern weggelassen würden, z. B. `"Output: " + 5 > 3 ...`, würde versucht werden, `"Output: 5" > 3` auszuwerten, was nicht kompiliert, da der Operator `>` nicht auf einen String und eine Zahl angewendet werden kann).*

---

### Frage 18: Boolescher logischer XOR-Operator
Was ist der Wert von `result` nach der Ausführung des folgenden Zustands?
```java
boolean a = true;
boolean b = false;
boolean result = a ^ b;
```
- A. `true`
- B. `false`
- C. Kompiliert nicht, da `^` nur ein bitweiser Operator für Ganzzahlen ist.
- D. Wirft zur Laufzeit eine Exception.

**Answer: A**
**Detailed Explanation:**
In Java dient das Zirkumflex-Zeichen `^` sowohl als bitweiser XOR-Operator für Ganzzahlen als auch als **logischer exklusiver ODER-Operator (XOR)** für boolesche Operanden.
- Das exklusive ODER gibt genau dann `true` zurück, wenn **exakt einer der Operanden true ist** (d. h. sie unterschiedliche boolesche Werte haben).
- Da `a` gleich `true` und `b` gleich `false` ist, wertet `a ^ b` zu `true` aus.

---

### Frage 19: Auswertung verschachtelter ternärer Operatoren
Was ist der Wert von `y` nach der Ausführung der folgenden Anweisung?
```java
int x = 5;
int y = x < 3 ? 10 : x > 4 ? 20 : 30;
```
- A. `10`
- B. `20`
- C. `30`
- D. Kompiliert nicht.

**Answer: B**
**Detailed Explanation:**
Ternäre Operatoren werden von rechts nach links assoziiert.
- Der Ausdruck wird geparst als: `x < 3 ? 10 : (x > 4 ? 20 : 30)`.
- Zuerst wird die äußerste Bedingung `x < 3` (Auswertung von `5 < 3`) geprüft. Diese ist `false`.
- Daher werten wir den Else-Ausdruck aus: `(x > 4 ? 20 : 30)`.
- Die Bedingung `x > 4` (Auswertung von `5 > 4`) wird geprüft. Diese ist `true`.
- Der Ausdruck wird zu `20` aufgelöst.
- Ausgabe: `20`.

---

### Frage 20: Arithmetische Promotion bei char
Was ist das Ergebnis der Ausführung der folgenden Anweisung?
```java
char c = 'A'; // Unicode value 65
c = c + 1;
System.out.println(c);
```
- A. `B`
- B. `A1`
- C. Kompiliert nicht.
- D. Wirft zur Laufzeit eine ClassCastException.

**Answer: C**
**Detailed Explanation:**
Im Ausdruck `c + 1` wird die `char`-Variable `c` vor der Addition implizit zu einem `int` (Wert `65`) promotet.
- Das Ergebnis der Addition `65 + 1` ist `66`, was vom Typ `int` ist.
- Sie können einer `char`-Variable keinen `int`-Wert ohne expliziten Cast zuweisen (`c = (char) (c + 1);`).
- Daher schlägt die Kompilierung bei `c = c + 1;` fehl.
- *(Hinweis: Wenn eine zusammengesetzte Zuweisung verwendet worden wäre, z. B. `c += 1;`, würde es aufgrund des impliziten Casts erfolgreich kompilieren).*
