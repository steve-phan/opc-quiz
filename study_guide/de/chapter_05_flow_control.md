# Kapitel 5: Schleifenstrukturen & Kontrollanweisungen

## 1. Core Java 21 Prüfungsziele
- Beherrschen aller Schleifenstrukturen: `for`, erweiterte `for` (for-each), `while` und `do-while`.
- Den detaillierten Ablauf der Auswertung von `for`-Schleifenausdrücken verstehen.
- Schleifen steuern mit `break`, `continue` und verschachtelten Labels.
- Gültigkeitsbereiche (Scopes) lokaler Variablen und Compiler-Einschränkungen innerhalb von Schleifen analysieren.

---

## 2. Detaillierte Konzepte

### Schleifentypen und Lebenszyklen
Java unterstützt drei primäre Schleifenkonstrukte:
1. **`while`-Schleife:** Eine kopfgesteuerte Schleife. Die boolesche Bedingung wird *vor* der Ausführung des Schleifenrumpfs geprüft. Wenn sie anfangs false ist, wird der Rumpf nie ausgeführt.
2. **`do-while`-Schleife:** Eine fußgesteuerte Schleife. Der Rumpf wird *zuerst* ausgeführt, danach wird die Bedingung geprüft. Der Rumpf wird daher immer **mindestens einmal** ausgeführt.
3. **`for`-Schleife (Basisform):** Wird verwendet, wenn die Anzahl der Iterationen bekannt ist. Sie enthält drei Ausdrücke: Initialisierung, Bedingung und Aktualisierung (Update).
4. **Erweiterte `for`-Schleife (for-each):** Vereinfacht die Iteration über Arrays und Collections, die das Interface `java.lang.Iterable` implementieren.

### Detaillierter Ausführungsfluss einer `for`-Schleife
Eine Standard-`for`-Schleife läuft in einem strengen, sequenziellen Zyklus ab:
$$\text{Initialisierung} \rightarrow \text{Bedingungsprüfung} \rightarrow \text{Schleifenrumpf} \rightarrow \text{Aktualisierung} \rightarrow \text{Bedingungsprüfung...}$$

```
                     +-----------------------+
                     | 1. Initialisierung    | (Wird genau einmal ausgeführt)
                     +-----------+-----------+
                                 |
                                 v
                     +-----------+-----------+
       +------------>| 2. Bedingungsprüfung  |<----------+
       |             +-----------+-----------+           |
       |                         |                       |
       |                (True)   |   (False)             |
       |                         v                       |
       |             +-----------+-----------+           |
       |             | 3. Schleifenrumpf     |           |
       |             +-----------+-----------+           |
       |                         |                       |
       |                         v                       |
       |             +-----------+-----------+           |
       |             | 4. Aktualisierung     |           |
       |             +-----------+-----------+           |
       |                         |                       |
       |                         +-----------------------+
       |
       v
  [Schleife verlassen]
```

### Compiler-Regeln & Gültigkeitsbereiche (Scopes) in Schleifen
- **Gültigkeitsbereich der Initialisierung:** Variablen, die im Initialisierungsblock einer `for`-Schleife deklariert werden, sind lokal für diese Schleife. Der Versuch, außerhalb des Schleifenblocks auf sie zuzugreifen, führt zu einem Kompilierfehler.
- **Mehrere Initialisierungs-Deklarationen:** Sie können im Initialisierungsblock einer `for`-Schleife mehrere Variablen deklarieren, diese müssen jedoch vom **selben Datentyp** sein:
  - `for (int i = 0, j = 10; i < j; i++)` (Gültig)
  - `for (int i = 0, long j = 10; i < j; i++)` (Kompilierfehler)
- **Unerreichbarer Code (Unreachable Code):** Der Compiler prüft auf toten Code. Wenn er eine Schleife erkennt, die niemals beendet werden kann, oder Code, der auf eine Endlosschleife folgt, wirft er einen Kompilierfehler.
  - `while (false) { ... }` (Kompilierfehler: unerreichbarer Code)

---

## 3. JVM-Interna & Speicherlayout

### Schleifen-Kompilierung in Bytecode (Jumps & Labels)
Auf der Ebene des JVM-Bytecodes werden Schleifen und gelabelte Steuerungsanweisungen in Vergleichsbefehle und Sprungbefehle (`goto` und bedingte Verzweigungen) übersetzt.
Betrachten wir:
```java
outer: for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (i == 1) break outer;
    }
}
```
Der Compiler übersetzt das Label `outer` in einen Byte-Offset innerhalb des Befehlsstroms.
- Ein einfacher `break`-Befehl springt zum Offset direkt *nach* der aktuellen Schleife.
- Ein gelabelter Befehl `break outer` springt zum Offset direkt *nach* der äußeren Schleife.
- Ein gelabelter Befehl `continue outer` springt zum Aktualisierungsausdruck der äußeren Schleife.

Diese JVM-Sprünge machen die Erstellung von verschachtelten Statusprüfungsvariablen überflüssig, was gelabelte Strukturen im Hinblick auf Befehlszyklen hochgradig effizient macht.

---

## 4. Tricky OCP Exam Questions

### Frage 1: Gelabeltes Continue und Break in verschachtelten Schleifen
Was ist die Ausgabe bei der Ausführung des folgenden Programms?
```java
public class NestControl {
    public static void main(String[] args) {
        int total = 0;
        OUTER: for (int i = 1; i <= 3; i++) {
            INNER: for (int j = 1; j <= 3; j++) {
                if (i == 2 && j == 2) {
                    continue OUTER;
                }
                if (i == 3 && j == 1) {
                    break INNER;
                }
                total += i * j;
            }
        }
        System.out.println("Total: " + total);
    }
}
```
- A. `Total: 15`
- B. `Total: 17`
- C. `Total: 8`
- D. `Total: 24`

**Antwort: C**
**Ausführliche Erklärung:**
- Lassen Sie uns die Schleifendurchläufe systematisch nachverfolgen:
- **`i = 1`:**
  - `j = 1`: `total += 1 * 1 = 1`.
  - `j = 2`: `total += 1 * 2 = 2` (Summe ist `3`).
  - `j = 3`: `total += 1 * 3 = 3` (Summe ist `6`).
- **`i = 2`:**
  - `j = 1`: `total += 2 * 1 = 2` (Summe ist `8`).
  - `j = 2`: Die Bedingung `i == 2 && j == 2` ergibt `true`. Das Programm führt `continue OUTER;` aus. Dies bricht die Ausführung der inneren Schleife sofort ab und übergibt die Kontrolle an den Aktualisierungsausdruck (`i++`) der `OUTER`-Schleife.
- **`i = 3`:**
  - `j = 1`: Die Bedingung `i == 3 && j == 1` ist `true`. Das Programm führt `break INNER;` aus. Dies beendet die aktuelle Ausführung der `INNER`-Schleife. Die Kontrolle kehrt zum Aktualisierungsausdruck der äußeren Schleife zurück.
- Die `OUTER`-Schleife schließt ihre Durchlaufprüfung (`i <= 3`) ab und die Schleifensequenz endet.
- Der endgültige Wert von `total` ist somit `8`.

---

### Frage 2: do-while-Schleifen-Scope-Falle
Was ist das Ergebnis des Versuchs, den folgenden Code zu kompilieren und auszuführen?
```java
public class DoWhileScope {
    public static void main(String[] args) {
        do {
            int x = 5;
            System.out.print(x-- + " ");
        } while (x > 0);
    }
}
```
- A. Gibt `5 ` aus und endet.
- B. Gibt `5 4 3 2 1 ` aus und endet.
- C. Kompiliert nicht.
- D. Eine Endlosschleife, die `5 5 5...` ausgibt.

**Antwort: C**
**Ausführliche Erklärung:**
- Eine häufige Falle in der OCP-Prüfung besteht darin, eine Variable innerhalb des Rumpfs einer `do-while`-Schleife zu deklarieren und im Bedingungsteil der Schleife auf sie zuzugreifen.
- In Java ist der Gültigkeitsbereich (Scope) einer Variable durch den Block `{ ... }` definiert, in dem sie deklariert wurde.
- Die Variable `x` wird innerhalb des `do`-Blocks deklariert. Folglich ist `x` außerhalb der geschweiften Klammern ungültig und unsichtbar.
- Die Bedingungsprüfung `while (x > 0)` befindet sich *außerhalb* des Rumpfblocks. Daher kann der Compiler die Variable `x` in dieser Zeile nicht auflösen, was zu einem Kompilierfehler führt: `cannot find symbol: variable x`.
- Um dies zu beheben, muss `x` vor dem `do`-Block deklariert werden: `int x = 5; do { ... } while (x > 0);`.

---

### Frage 3: Initialisierungsgrenzen der for-Schleife
Welche der folgenden `for`-Schleifendeklarationen verursachen einen Kompilierfehler? (Wählen Sie alle zutreffenden Optionen aus)
- A. `for (int i = 0, j = 10; i < j; i++) {}`
- B. `for (int i = 0, long j = 10; i < j; i++) {}`
- C. `for (var i = 0, j = 10; i < 5; i++) {}`
- D. `int i = 0, j = 0; for (i = 5, j = 10; i < j; i++) {}`

**Antwort: B, C**
**Ausführliche Erklärung:**
- **A kompiliert:** Sie können im Initialisierungsblock einer `for`-Schleife mehrere Variablen deklarieren, solange sie denselben Datentyp haben (hier sind beide `int`).
- **B kompiliert nicht:** Sie können in einer einzigen Initialisierungsanweisung keine Variablen unterschiedlicher Typen (hier `int` und `long`) deklarieren.
- **C kompiliert nicht:** Bei der Verwendung der lokalen Typinferenz (`var`) in einer zusammengesetzten Deklaration kann der Compiler keine unterschiedlichen oder mehrere Typen ableiten. `var` ist in zusammengesetzten Deklarationen verboten (z. B. ist `var a = 1, b = 2;` ungültig).
- **D kompiliert:** Die Variablen `i` und `j` werden vor der Schleife deklariert und initialisiert. Der Initialisierungsblock der Schleife weist ihnen lediglich neue Werte zu. Zuweisungen sind einfache Ausdrücke, keine Deklarationen, daher ist das Mischen von Werten erlaubt.

---

### Frage 4: Unerreichbarer Code nach Endlosschleife
Was ist das Ergebnis der Kompilierung der folgenden Klasse?
```java
public class InfiniteLoop {
    public static void main(String[] args) {
        while (false) {
            System.out.println("Inside");
        }
        System.out.println("Outside");
    }
}
```
- A. Kompiliert erfolgreich und gibt `Outside` aus.
- B. Kompiliert erfolgreich, gibt aber nichts aus.
- C. Kompiliert aufgrund von unerreichbarem Code nicht.
- D. Kompiliert nicht, weil `while (false)` syntaktisch ungültig ist.

**Antwort: C**
**Ausführliche Erklärung:**
- Der Java-Compiler führt eine grundlegende Ablaufanalyse durch. Wenn er feststellt, dass ein Codeblock unter keinen Umständen erreicht werden kann, wirft er einen Kompilierfehler: `unreachable code`.
- Da die Schleifenbedingung die Compilezeit-Konstante `false` ist, weiß der Compiler, dass der Schleifenrumpf `System.out.println("Inside");` niemals betreten werden kann.
- Daher wird der Code im Schleifenrumpf als unerreichbar markiert, was zum Fehlschlagen der Kompilierung führt.
- *(Hinweis: Interessanterweise ist `if (false) { ... }` als Sonderausnahme vom Compiler erlaubt, um bedingte Kompilierung/Debugging-Flags zu unterstützen, aber `while (false)` und `for (; false; )` werden strikt abgelehnt).*

---

### Frage 5: Unerreichbarer Code nach einer unendlichen for-Schleife
Was ist das Ergebnis der Kompilierung der folgenden Klasse?
```java
public class ForInfinite {
    public static void main(String[] args) {
        for (;;) {
            // empty
        }
        System.out.println("Done"); // Line 6
    }
}
```
- A. Kompiliert und läuft unendlich.
- B. Kompiliert nicht wegen unerreichbaren Codes in Zeile 6.
- C. Kompiliert nicht, weil bei `for (;;)` die Schleifenbedingungen fehlen.
- D. Kompiliert und gibt `Done` aus.

**Antwort: B**
**Ausführliche Erklärung:**
- Das Schleifenkonstrukt `for (;;)` definiert eine gültige Endlosschleife.
- Da keine Bedingung in der Schleife angegeben ist, wird sie als unendlicher Zyklus ausgewertet, der keinen Ausstiegspfad (kein `break`, `return` oder `throw`) hat.
- Der Compiler führt eine statische Ablaufanalyse durch und stellt fest, dass die auf die Endlosschleife folgende Anweisung `System.out.println("Done");` niemals erreicht werden kann.
- Dies führt zu einem Kompilierfehler: `unreachable statement`.

---

### Frage 6: Erweiterte for-Schleife mit einer Null-Collection
Was ist das Ergebnis der Ausführung des folgenden Codes?
```java
import java.util.List;
public class NullForEach {
    public static void main(String[] args) {
        List<String> list = null;
        for (var item : list) {
            System.out.println(item);
        }
    }
}
```
- A. Die Schleife wird beendet, ohne etwas auszugeben.
- B. Kompiliert nicht.
- C. Wirft zur Laufzeit eine `NullPointerException`.
- D. Gibt `null` aus.

**Antwort: C**
**Ausführliche Erklärung:**
- Die erweiterte `for`-Schleife (for-each) wird im Hintergrund in einen Iterator-Aufruf übersetzt.
- Unter der Haube wird `for (var item : list)` wie folgt übersetzt:
  ```java
  java.util.Iterator<String> it = list.iterator();
  while (it.hasNext()) { ... }
  ```
- Da `list` den Wert `null` hat, wirft der Aufruf von `list.iterator()` (oder die Prüfung der Array-Länge, falls es sich um eine Null-Array-Referenz handeln würde) zur Laufzeit sofort eine `NullPointerException`.

---

### Frage 7: Ändern der Variablen einer erweiterten for-Schleife
Was ist die Ausgabe des folgenden Programms?
```java
public class ModForEach {
    public static void main(String[] args) {
        int[] array = { 1, 2, 3 };
        for (int x : array) {
            x = x * 2;
        }
        for (int x : array) {
            System.out.print(x + " ");
        }
    }
}
```
- A. `2 4 6 `
- B. `1 2 3 `
- C. `2 2 3 `
- D. Kompiliert nicht.

**Antwort: B**
**Ausführliche Erklärung:**
- In einer erweiterten `for`-Schleife enthält die Schleifenvariable (`int x`) eine **Kopie** des Wertes des aktuellen Elements im Array oder in der Collection.
- Das Ändern von `x` innerhalb des Schleifenrumpfs (`x = x * 2;`) ändert nur die lokale Kopie `x`.
- Es schreibt **nicht** zurück in das ursprüngliche Array und ändert nicht die Werte an den Array-Indizes.
- Daher bleibt das Array unverändert und die zweite Schleife gibt `1 2 3 ` aus.

---

### Frage 8: Break in einem gelabelten Codeblock
Ist der folgende Codeblock syntaktisch gültig und was ist seine Ausgabe?
```java
public class LabeledBlock {
    public static void main(String[] args) {
        int val = 10;
        BLOCK: {
            if (val > 5) {
                System.out.print("A ");
                break BLOCK;
            }
            System.out.print("B ");
        }
        System.out.print("C");
    }
}
```
- A. Kompiliert nicht, weil `BLOCK` nicht mit einer Schleifenstruktur verknüpft ist.
- B. Kompiliert und gibt `A C` aus.
- C. Kompiliert und gibt `A B C` aus.
- D. Wirft eine Laufzeitausnahme.

**Antwort: B**
**Ausführliche Erklärung:**
- In Java können Labels auf **jeden Block** angewendet werden, nicht nur auf Schleifen (`for`, `while`) oder `switch`-Anweisungen.
- Der Block `BLOCK: { ... }` definiert einen gelabelten Ausführungsblock.
- Innerhalb des Blocks springt der Aufruf von `break BLOCK;` sofort zum Ende des gelabelten Blocks und überspringt alle verbleibenden Anweisungen innerhalb dieses Blocks.
- Da `val > 5` als `true` ausgewertet wird, wird `"A "` gedruckt und `break BLOCK;` ausgeführt, wodurch `"B "` übersprungen wird. Die Kontrolle geht auf die Anweisung nach dem Block über, die `"C"` ausgibt.
- Ausgabe: `A C`.

---

### Frage 9: Auswertungsreihenfolge der while-Schleifenbedingung
Was gibt die folgende Schleife aus?
```java
int x = 0;
while (x++ < 3) {
    System.out.print(x + " ");
}
```
- A. `0 1 2 `
- B. `1 2 3 `
- C. `1 2 3 4 `
- D. `0 1 2 3 `

**Antwort: B**
**Ausführliche Erklärung:**
- Lassen Sie uns den Ablauf nachverfolgen:
- **Durchlauf 1:**
  - Die Bedingung prüft `x++ < 3`.
  - `x++` wird als `0` ausgewertet (aktueller Wert von `x`). Der Vergleich lautet `0 < 3`, was `true` ergibt.
  - Sofort nach der Auswertung wird `x` auf `1` erhöht.
  - Der Schleifenrumpf läuft und gibt `x` aus (das jetzt `1` ist): gibt `1 ` aus.
- **Durchlauf 2:**
  - Die Bedingung prüft `x++ < 3`.
  - `x++` wird als `1` ausgewertet. `1 < 3` ist `true`.
  - `x` wird auf `2` erhöht.
  - Der Schleifenrumpf gibt `x` aus: gibt `2 ` aus.
- **Durchlauf 3:**
  - Die Bedingung prüft `x++ < 3`.
  - `x++` wird als `2` ausgewertet. `2 < 3` ist `true`.
  - `x` wird auf `3` erhöht.
  - Der Schleifenrumpf gibt `x` aus: gibt `3 ` aus.
- **Durchlauf 4:**
  - Die Bedingung prüft `x++ < 3`.
  - `x++` wird als `3` ausgewertet. `3 < 3` ist `false`.
  - `x` wird auf `4` erhöht.
  - Die Schleife wird beendet.
- Ausgabe: `1 2 3 `.

---

### Frage 10: Ungültiges Ziel für eine erweiterte for-Schleife
Über welche der folgenden Deklarationen kann nicht direkt mit einer erweiterten `for`-Schleife iteriert werden?
- A. `int[] array`
- B. `java.util.ArrayList<String> list`
- C. `java.util.Map<String, String> map`
- D. `java.util.Set<Integer> set`

**Antwort: C**
**Ausführliche Erklärung:**
- Das Ziel einer erweiterten `for`-Schleife muss entweder ein primitives/Objekt-**Array** oder ein Objekt sein, das das Interface **`java.lang.Iterable`** implementiert.
- `ArrayList` und `Set` erben von `Collection`, welches wiederum `Iterable` erweitert. Daher kann über sie direkt iteriert werden.
- Das Interface `Map` implementiert `Iterable` **nicht**. Um über Map-Schlüssel oder -Einträge zu iterieren, müssen Sie `map.keySet()`, `map.values()` oder `map.entrySet()` aufrufen, welche `Set`- oder `Collection`-Objekte zurückgeben, die wiederum `Iterable` implementieren.
- Der Versuch, direkt über `map` zu iterieren, führt daher zu einem Kompilierfehler.

---

### Frage 11: Switch-Ausdruck innerhalb einer Schleife
Was ist die Ausgabe des folgenden Programms?
```java
public class LoopSwitch {
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) {
            System.out.print(switch(i) {
                case 0 -> "A";
                case 1 -> "B";
                default -> "C";
            } + " ");
        }
    }
}
```
- A. `A B C `
- B. `A B B `
- C. Kompiliert nicht, weil Switch-Ausdrücke nicht in Schleifen verschachtelt werden können.
- D. Kompiliert nicht, weil Case-Zweige Blöcke haben müssen.

**Antwort: A**
**Ausführliche Erklärung:**
- Switch-Ausdrücke sind Ausdrücke. Das bedeutet, dass sie überall dort vorkommen können, wo auch jeder andere Ausdruck erlaubt ist (einschließlich innerhalb von String-Verkettungen, Methodenaufrufen oder Schleifenstrukturen).
- Die Schleife läuft dreimal:
  - `i = 0`: Switch gibt `"A"` zurück, gibt `A ` aus.
  - `i = 1`: Switch gibt `"B"` zurück, gibt `B ` aus.
  - `i = 2`: Switch gibt `"C"` zurück, gibt `C ` aus.
- Ausgabe: `A B C `.

---

### Frage 12: Schleifenvariablen-Shadowing
Was ist das Ergebnis der Kompilierung der folgenden Klasse?
```java
public class ShadowLoop {
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) {
            int i = 10; // Line 4
            System.out.print(i + " ");
        }
    }
}
```
- A. Kompiliert und gibt `10 10 10 ` aus.
- B. Kompiliert nicht aufgrund einer doppelten Variablendeklaration in Zeile 4.
- C. Kompiliert und gibt `10 ` aus (bricht sofort ab).
- D. Kompiliert nicht, weil eine Schleifenvariable nicht überschrieben (shadowed) werden kann.

**Antwort: B**
**Ausführliche Erklärung:**
- In Java können Sie keine lokale Variable deklarieren, die denselben Namen wie eine andere bereits in demselben Scope oder einem umschließenden Elternblock deklarierte Variable hat.
- Der Schleifeninitialisierungsblock deklariert `int i` und platziert es im lokalen Scope der `for`-Schleife.
- Der Versuch, `int i = 10;` innerhalb des Schleifenrumpfblocks (Zeile 4) zu deklarieren, führt zu einem Kompilierfehler wegen einer doppelten lokalen Variable: `variable i is already defined in method main(String[])`.

---

### Frage 13: Deklarationsgrenzen im Aktualisierungsblock einer Schleife
Welche der folgenden Aussagen über den Aktualisierungsblock (den dritten Teil) einer einfachen `for`-Schleife ist wahr?
- A. Sie können darin neue Schleifensteuerungsvariablen deklarieren.
- B. Er darf nur einen einzigen Ausdruck enthalten.
- C. Er kann mehrere durch Kommata getrennte Ausdrücke enthalten, darf jedoch keine Variablendeklarationen enthalten.
- D. Er muss eine Inkrement- oder Dekrementanweisung enthalten; andere Operationen sind verboten.

**Antwort: C**
**Ausführliche Erklärung:**
- Der dritte Teil einer `for`-Schleife (der Aktualisierungsausdruck) akzeptiert eine Liste von durch Kommata getrennten Ausdrücken (wie Inkremente, Dekrementierungen, Methodenaufrufe oder Zuweisungen).
- Er darf jedoch **keine** Deklarationen enthalten (z. B. können Sie nicht schreiben: `for (int i = 0; i < 5; i++, int x = 0)`).
- Daher ist C richtig.

---

### Frage 14: Schleifenaustritt und Variablenwert
Welchen Wert hat `i`, nachdem die folgende Schleife beendet ist?
```java
int i;
for (i = 0; i < 5; i++) {
    if (i == 3) {
        break;
    }
}
System.out.println(i);
```
- A. `3`
- B. `4`
- C. `5`
- D. Der Code kompiliert nicht, weil `i` außerhalb der Schleife ungültig (out of scope) ist.

**Antwort: A**
**Ausführliche Erklärung:**
- Die Variable `i` wird vor der Schleife deklariert, sodass sie nach Beendigung der Schleife sichtbar ist.
- Die Schleife erhöht `i` schrittweise: `0`, `1`, `2`, `3`.
- Wenn `i` gleich `3` ist, ist die Bedingung `i == 3` `true`, wodurch `break;` ausgeführt wird.
- Die `break`-Anweisung beendet die Schleife sofort. Der Aktualisierungsausdruck nach dem Durchlauf (`i++`) wird **nicht ausgeführt**.
- Daher bleibt der Wert von `i` bei `3`, wenn die Ausgabeanweisung ausgeführt wird.

---

### Frage 15: Schleifenbedingungen mit Float-Variablen
Wie verhält sich die folgende Schleife?
```java
float val = 0.0f;
while (val < 1.0f) {
    val += 0.2f;
}
System.out.println(val);
```
- A. Sie läuft genau 5 Mal und gibt `1.0` aus.
- B. Sie läuft aufgrund von Fließkomma-Rundungsfehlern unendlich.
- C. Sie kompiliert und gibt einen Wert aus, der geringfügig größer als `1.0` ist (wie `1.0000001`).
- D. Kompiliert nicht.

**Antwort: C**
**Ausführliche Erklärung:**
- Die Fließkomma-Arithmetik is anfällig für Rundungsfehler, da Dezimalwerte wie `0.2` nicht mit perfekter binärer Präzision dargestellt werden können.
- Die Schleife läuft und addiert jedes Mal `0.2f`:
  - Durchlauf 1: `0.2`
  - Durchlauf 2: `0.4`
  - Durchlauf 3: `0.6`
  - Durchlauf 4: `0.8`
  - Durchlauf 5: `1.0` (oder ein Wert, der aufgrund der Float-Präzision geringfügig größer oder kleiner ist).
- Wenn der akkumulierte Wert geringfügig kleiner als `1.0` ist (z. B. `0.9999999`), wird die Schleife ein sechstes Mal ausgeführt, was `val` über `1.0` anhebt (auf ungefähr `1.200000047`).
- In der Float-Darstellung wird die Schleife erfolgreich beendet und der endgültige Float-Wert ausgegeben, der geringfügig über `1.0` liegt. Sie läuft nicht unendlich.

---

### Frage 16: Redundanter boolescher Schleifenbedingungsvergleich
Welcher der folgenden Ausdrücke is syntaktisch gültig und repräsentiert den empfohlenen Stil zur Prüfung einer booleschen Schleifenbedingung?
- A. `while (flag == true)`
- B. `while (flag)`
- C. `while (flag.equals(true))`
- D. `while (flag = true)`

**Antwort: B**
**Ausführliche Erklärung:**
- Obwohl `flag == true` gültig ist, ist es redundant, da `flag` bereits ein boolescher Ausdruck ist.
- `while (flag)` ist der Standard, sauberere und empfohlene Stil.
- `flag = true` kompiliert zwar (wenn `flag` ein `boolean` ist), weist `flag` jedoch `true` zu, was zu einer Endlosschleife führt (was fast immer ein Programmierfehler ist).

---

### Frage 17: Schleifen-Break ohne Label in einem Nicht-Schleifen-Block
Was ist das Ergebnis des Versuchs, den folgenden Code zu kompilieren?
```java
public class NonLoopBreak {
    public static void main(String[] args) {
        int val = 10;
        if (val > 5) {
            break;
        }
    }
}
```
- A. Kompiliert und wird erfolgreich ausgeführt.
- B. Kompiliert nicht, weil `break` nicht innerhalb eines Schleifen- oder Switch-Blocks liegt.
- C. Kompiliert nicht, weil der `if`-Block ein Label haben muss.
- D. Wirft einen Laufzeitfehler.

**Antwort: B**
**Ausführliche Erklärung:**
- Die `break`-Anweisung ohne Label ist streng auf umschließende Schleifenblöcke (`for`, `while`, `do-while`) oder `switch`-Blöcke beschränkt.
- Da sich die `break`-Anweisung innerhalb eines `if`-Blocks befindet, der nicht innerhalb einer Schleife oder eines Switch-Statements liegt, lehnt der Compiler dies mit dem Fehler ab: `break outside of switch or loop`.

---

### Frage 18: Vergleich der Darstellung von Endlosschleifen
Welche der folgenden Schleifen kompiliert zu exakt denselben Bytecode-Instruktionen wie `while (true) {}`?
- A. `do {} while (true);`
- B. `for (;;) {}`
- C. `for (; true; ) {}`
- D. Alle oben genannten kompilieren zur selben grundlegenden Endlosschleifenstruktur.

**Antwort: D**
**Ausführliche Erklärung:**
- Der Compiler optimiert Konstanten zur Kompilierzeit.
- `while (true) {}`, `for (;;) {}`, `for (; true; ) {}` und `do {} while (true);` werden alle als bedingungslose Endlosschleifenstrukturen erkannt.
- Die generierte Bytecode-Struktur verwendet eine bedingungslose Sprunganweisung (`goto`), um an den Anfang des Blocks zurückzuspringen, was zu identischem Laufzeitverhalten und Speicherbedarf führt.

---

### Frage 19: Traditionelles Switch-Statement mit Platzierung des Default-Case
Was wird durch das folgende Codesegment ausgegeben?
```java
int val = 5;
switch (val) {
    default:
        System.out.print("Default ");
    case 1:
        System.out.print("One ");
    case 2:
        System.out.print("Two");
}
```
- A. `Default `
- B. `Default One Two`
- C. `One Two`
- D. Kompiliert nicht, weil `default` am Ende des Switch-Statements platziert werden muss.

**Antwort: B**
**Ausführliche Erklärung:**
- In einem `switch`-Statement (oder -Ausdruck) kann der `default`-Case **überall** platziert werden (am Anfang, in der Mitte oder am Ende).
- Wenn bei der Ausführung kein Case mit dem Selektorwert übereinstimmt (`val = 5`), springt die Ausführung zum `default`-Block.
- In diesem Code beginnt die Ausführung bei `default:` und gibt `"Default "` aus.
- Da keine `break`-Anweisungen vorhanden sind, fällt die Ausführung nacheinander durch (Fall-Through), führt `case 1` aus (gibt `"One "` aus) und `case 2` (gibt `"Two"` aus).
- Daher lautet die Ausgabe `Default One Two`.

---

### Frage 20: Leere Schleifeninitialisierung
Kompiliert der folgende Code, und wenn ja, was ist die Ausgabe?
```java
int i = 0;
for (; i < 2; ) {
    System.out.print(i++ + " ");
}
```
- A. Kompiliert nicht, weil der erste und der dritte Teil der `for`-Schleife leer sind.
- B. Kompiliert und gibt `0 1 ` aus.
- C. Kompiliert, führt aber zu einer Endlosschleife.
- D. Kompiliert und gibt `0 1 2 ` aus.

**Antwort: B**
**Ausführliche Erklärung:**
- In einer Standard-`for`-Schleife sind alle drei Teile (Initialisierung, Bedingung, Aktualisierung) **optional**.
- Hier wird die Initialisierung weggelassen, da `i` zuvor deklariert wurde.
- Die Aktualisierung wird weggelassen, da sie innerhalb des Schleifenrumpfs ausgeführt wird (`i++`).
- Die Schleife läuft zweimal:
  - Durchlauf 1: `i = 0` (0 < 2 ist true), gibt `0 ` aus, `i` wird zu 1.
  - Durchlauf 2: `i = 1` (1 < 2 ist true), gibt `1 ` aus, `i` wird zu 2.
  - Durchlauf 3: `i = 2` (2 < 2 ist false), die Schleife endet.
- Ausgabe: `0 1 `.
