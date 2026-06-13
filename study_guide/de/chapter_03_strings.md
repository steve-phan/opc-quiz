# Kapitel 3: String-Handhabung & String Constant Pool (SCP)

## 1. Kernziele der Java 21 Prüfung
- Erklären des Konzepts der String-Immutabilität (Unveränderlichkeit) und ihrer Vorteile.
- Beherrschung des String Constant Pools (SCP) und der Methode `String.intern()`.
- Unterscheidung zwischen `String`, `StringBuilder` und `StringBuffer`.
- Manipulation von Strings unter Verwendung von Standardmethoden und Java 15+ Text Blocks (Textblöcken).

---

## 2. Detaillierte Konzepte

### String-Immutabilität & Warum sie wichtig ist
In Java ist die Klasse `String` als `final` deklariert, und ihr zugrundeliegendes Zeichen-Array ist unveränderlich (in modernem Java als `private final byte[] value` deklariert, unter Verwendung von Compact Strings). Sobald ein `String`-Objekt im Speicher erstellt wurde, können seine Zeichen nicht mehr geändert werden. Alle Operationen, die einen String scheinbar verändern (z. B. `toUpperCase()`, `concat()`, `substring()`), weisen tatsächlich ein **brandneues String-Objekt** auf dem Heap zu.

#### Vorteile der Unveränderlichkeit (Immutability):
1. **Sicherheit:** Strings werden für Datenbank-Anmeldeinformationen, URLs und Dateipfade verwendet. Wenn Strings veränderbar wären, könnte ein Angreifer den Wert einer Verbindungszeichenfolge nach Sicherheitsprüfungen ändern.
2. **Threadsicherheit:** Mehrere Threads können dieselbe String-Instanz ohne Synchronisation gemeinsam nutzen.
3. **Caching:** Der Hashcode eines Strings wird bei der Erstellung des Strings berechnet und im Objekt gespeichert, was Operationen in hashbasierten Kollektionen (wie Schlüssel in einer `HashMap`) optimiert.
4. **Speicheroptimierung:** Ermöglicht die Existenz des String Constant Pools.

### Der String Constant Pool (SCP)
Um den Speicherbedarf zu reduzieren, verwaltet Java einen speziellen Speicherbereich innerhalb des Heaps, den **String Constant Pool (SCP)**.
- **Literale:** Wenn Sie einen String mithilfe von Anführungszeichen deklarieren (`String s1 = "Java";`), prüft die JVM zuerst den SCP. Wenn der String "Java" bereits im Pool vorhanden ist, wird `s1` die Referenz auf die vorhandene Instanz zugewiesen. Wenn er nicht existiert, erstellt Java ihn im SCP.
- **Heap-Objekte:** Wenn Sie `new String("Java");` verwenden, umgeht die JVM den Pool und weist ein neues String-Objekt im allgemeinen Heap-Speicher zu.
- **Die Methode `intern()`:** Der Aufruf von `s.intern()` weist die JVM an, zu prüfen, ob ein gleicher String im SCP vorhanden ist. Wenn er gefunden wird, gibt sie die Referenz aus dem Pool zurück. Wenn er nicht gefunden wird, fügt sie den String dem Pool hinzu und gibt seine Referenz zurück.

```
+-------------------------------------------------------------+
| JVM HEAP-SPEICHER                                           |
|                                                             |
|   [ String Constant Pool (SCP) ]                            |
|   +-----------------------+                                 |
|   | "Java" (Adresse: 0x11)|<--------- s1 ("Java")           |
|   +-----------------------+<--------- s2 ("Java")           |
|                                                             |
|   [ Allgemeiner Heap-Bereich]                               |
|   +-----------------------+                                 |
|   | "Java" (Adresse: 0x22)|<--------- s3 (new String("Java"))|
|   +-----------------------+                                 |
+-------------------------------------------------------------+
```

---

## 3. JVM-Interna & Speicherlayout

### Interna des String Pools
Der String Constant Pool ist intern als Hash-Tabelle (ähnlich einer `HashMap`) mit einer festen Anzahl an Buckets implementiert.
- Sie können die Größe der Tabelle mit dem JVM-Argument `-XX:StringTableSize=N` anpassen.
- Die Garbage Collection bereinigt den SCP von nicht mehr referenzierten Strings. Literale Konstanten, die in Klassen definiert sind, sind jedoch geschützt, solange ihr Classloader geladen bleibt.

### Kapazitätsverwaltung bei `StringBuilder`
Im Gegensatz zu `String` repräsentiert `StringBuilder` eine veränderbare Folge von Zeichen. Die Zeichen werden in einem dynamisch anpassbaren Byte-Array gespeichert.
- **Standardkapazität:** 16 Zeichen.
- **Vergrößerungsformel:** Wenn das Array überläuft, erhöht der `StringBuilder` seine Kapazität nach folgender Formel:
  $$\text{Neue Kapazität} = (\text{Alte Kapazität} \times 2) + 2$$
- Da `StringBuilder` veränderbar und nicht threadsicher ist, arbeitet er bei sich wiederholenden Manipulationen (wie dem Anhängen in Schleifen) wesentlich schneller als `String`. Für threadsichere Operationen wird `StringBuffer` verwendet, dessen Methoden synchronisiert sind.

---

## 4. Tricky OCP Exam Questions

### Frage 1: String-Unveränderlichkeit und Seiteneffekte
Was ist die Ausgabe bei der Ausführung des folgenden Code-Segments?
```java
String s1 = "OCP";
String s2 = s1.concat(" 21");
s1.toLowerCase();
s2.replace('2', '1');
System.out.println(s1 + " - " + s2);
```
- A. `ocp - OCP 11`
- B. `OCP - OCP 21`
- C. `ocp - OCP 21`
- D. `OCP - OCP 11`

**Antwort: B**
**Detaillierte Erklärung:**
- Strings sind in Java **unveränderlich (immutable)**. Jede Methode, die auf einem String-Objekt aufgerufen wird und eine Modifikation durchführt, gibt ein *neues* String-Objekt zurück, anstatt das Original-Objekt zu manipulieren.
- `s1.concat(" 21")` erzeugt einen neuen String `"OCP 21"` und weist ihn `s2` zu. `s1` bleibt unverändert `"OCP"`.
- `s1.toLowerCase()` führt die Kleinschreibung aus und erzeugt das neue String-Objekt `"ocp"`. Dieser neue String wird jedoch verworfen, da seine Referenz keiner Variablen zugewiesen wird. `s1` bleibt `"OCP"`.
- `s2.replace('2', '1')` erzeugt den neuen String `"OCP 11"`, aber auch diese Referenz wird verworfen, da keine Neuzuweisung stattfindet. `s2` bleibt `"OCP 21"`.
- Daher lautet die Ausgabe `OCP - OCP 21`.

---

### Frage 2: String Constant Pool und Verkettung
Gegeben sind die folgenden Variablen:
```java
String base = "Java";
String s1 = "Java 21";
String s2 = "Java " + 21;
String s3 = base + " 21";
String s4 = (base + " 21").intern();

System.out.print((s1 == s2) + " " + (s1 == s3) + " " + (s1 == s4));
```
Was ist das ausgegebene Ergebnis?
- A. `true true true`
- B. `true false false`
- C. `true false true`
- D. `false false true`

**Antwort: C**
**Detaillierte Erklärung:**
- `s1` zeigt auf das Literal `"Java 21"`, das im String Constant Pool (SCP) erstellt wurde.
- `s2` wird durch das Zusammenfügen zweier literaler Konstanten gebildet: `"Java "` und `21`. Der Compiler führt diese Konkatenation bereits zur Compilezeit durch. Daher zeigt auch `s2` auf das Literal `"Java 21"` im SCP. Der Referenzvergleich `s1 == s2` ergibt `true`.
- `s3` wird durch die Verkettung einer Variablen (`base`) mit einem Literal erzeugt. Da `base` keine finale Variable ist, kann der Compiler dies nicht zur Compilezeit optimieren. Die Verkettung wird erst zur Laufzeit aufgelöst (typischerweise über `StringBuilder`), was ein neues String-Objekt im allgemeinen Heap-Speicher anlegt. Daher ergibt `s1 == s3` den Wert `false`.
- `s4` ruft auf dem zur Laufzeit erstellten String die Methode `intern()` auf. Diese sucht `"Java 21"` im SCP. Da der Wert dort bereits existiert, gibt sie die Referenz auf das bestehende SCP-Objekt zurück. Daher ergibt `s1 == s4` den Wert `true`.
- Die zusammengesetzte Ausgabe lautet: `true false true`.

---

### Frage 3: Die StringBuilder equals()-Falle
Was ist die Ausgabe des folgenden Codes?
```java
StringBuilder sb1 = new StringBuilder("Java");
StringBuilder sb2 = new StringBuilder("Java");
System.out.print((sb1 == sb2) + " " + sb1.equals(sb2));
```
- A. `true true`
- B. `true false`
- C. `false true`
- D. `false false`

**Antwort: D**
**Erklärung:**
- `sb1 == sb2` vergleicht die Speicheradressen von zwei verschiedenen `StringBuilder`-Instanzen auf dem Heap. Da sie mit dem Schlüsselwort `new` erstellt wurden, handelt es sich um unterschiedliche Objekte, weshalb `sb1 == sb2` den Wert `false` liefert.
- Im Gegensatz zur Klasse `String` überschreibt die Klasse `StringBuilder` die Methode `equals()` der Klasse `Object` **nicht**.
- Daher greift `sb1.equals(sb2)` standardmäßig auf die Referenzidentität (`==`) zurück. Da die beiden Referenzen unterschiedlich sind, wird `false` zurückgegeben.
- Um den Zeicheninhalt zweier `StringBuilder`-Instanzen zu vergleichen, müssen Sie diese entweder in Strings konvertieren (`sb1.toString().equals(sb2.toString())`) oder die Methode `compareTo()` verwenden (da `StringBuilder` das Interface `Comparable` implementiert: `sb1.compareTo(sb2) == 0`).

---

### Frage 4: StringBuilder Substring-Veränderlichkeit
Betrachten Sie dieses Code-Segment:
```java
StringBuilder sb = new StringBuilder("OracleJava");
sb.substring(6);
sb.delete(0, 6);
sb.append("SE");
System.out.println(sb);
```
Was ist die Ausgabe?
- A. `JavaSE`
- B. `OracleSE`
- C. `eJavaSE`
- D. `OracleJavaSE`

**Antwort: A**
**Erklärung:**
- `sb.substring(6)` gibt einen standardmäßigen, unveränderlichen `String` mit dem Inhalt `"Java"` zurück. Der entscheidende Punkt ist, dass der Aufruf von `substring()` den `StringBuilder` selbst **nicht** verändert. Da der zurückgegebene String nirgendwo gespeichert wird, hat diese Zeile keine Auswirkung auf `sb`.
- `sb.delete(0, 6)` modifiziert den `StringBuilder` direkt, indem die Zeichen von Index `0` bis (aber nicht inklusive) Index `6` (die Zeichen `"Oracle"`) gelöscht werden. Der verbleibende Inhalt ist `"Java"`.
- `sb.append("SE")` hakt `"SE"` an den veränderbaren Builder an, was zu `"JavaSE"` führt.
- Die Ausgabe ist somit `JavaSE`.

---

### Frage 5: Einrückungsregeln für Textblöcke
Was ist die Ausgabe der folgenden Textblock-Zuweisung (wobei Punkte Leerzeichen darstellen)?
```java
String text = """
....Alpha
......Beta
....""";
System.out.print(text);
```
- A. `Alpha\n..Beta`
- B. `....Alpha\n......Beta`
- C. `Alpha\nBeta`
- D. `Alpha\n....Beta`

**Antwort: A**
**Erklärung:**
- Java bestimmt den "zufälligen Whitespace" (incidental whitespace) eines Textblocks, indem es die am weitesten links ausgerichtete Spalte aller nicht-leeren Zeilen prüft, einschließlich der schließenden dreifachen Anführungszeichen `"""`.
- Die Zeilen sind hier:
  - `....Alpha` (4 Leerzeichen Einrückung)
  - `......Beta` (6 Leerzeichen Einrückung)
  - `....` (Die schließenden Anführungszeichen haben 4 Leerzeichen Einrückung)
- Die linke Grenze beträgt somit 4 Leerzeichen (definiert durch die Zeile mit `Alpha` und die schließenden Anführungszeichen). Der Compiler entfernt genau 4 Leerzeichen vom Anfang jeder Zeile.
- Das Ergebnis ist:
  - `Alpha` (0 führende Leerzeichen)
  - `..Beta` (2 führende Leerzeichen)
- Die letzte Zeile (die nur die schließenden Anführungszeichen enthält) wird vollständig entfernt. Ihre Position bestimmt jedoch, ob ein abschließender Zeilenumbruch angehängt wird. Da die schließenden Anführungszeichen in einer eigenen Zeile stehen, *wird* nach `Beta` ein Zeilenumbruch angefügt.
- Die Ausgabe lautet folglich `Alpha\n..Beta`.

---

### Frage 6: Textblöcke und Maskierung zur Zeilenfortsetzung
Was ist die Ausgabe bei der Ausführung dieses Code-Ausschnitts?
```java
String block = """
      Java \
      SE \
      21""";
System.out.println(block);
```
- A.
  ```
  Java 
  SE 
  21
  ```
- B. `Java SE 21`
- C. `Java \nSE \n21`
- D. Compiliert nicht aufgrund eines Syntaxfehlers im Textblock.

**Antwort: B**
**Erklärung:**
- Der Backslash `\` am Ende einer Zeile in einem Textblock fungiert als **Zeilenfortsetzungs-Escape-Sequenz** (Line Continuation).
- Er weist den Compiler an, das Einfügen des impliziten Zeilenumbruchs (Newline) am Ende dieser Zeile zu unterdrücken.
- Die nachfolgende Zeile wird somit direkt an die vorherige Zeile angehängt.
- Daher werden `"Java \`", `"SE \`" und `"21"` zu einer einzigen Zeile zusammengefügt: `"Java SE 21"`.

---

### Frage 7: String isEmpty() vs. isBlank()
Gegeben sind die folgenden Strings:
```java
String s1 = "";
String s2 = "   ";
String s3 = "\n\t";

System.out.print(s1.isEmpty() + "-" + s1.isBlank() + " ");
System.out.print(s2.isEmpty() + "-" + s2.isBlank() + " ");
System.out.print(s3.isEmpty() + "-" + s3.isBlank());
```
Was ist die Ausgabe?
- A. `true-true false-true false-true`
- B. `true-true false-false false-false`
- C. `true-true false-true false-false`
- D. `true-false false-true false-true`

**Antwort: A**
**Erklärung:**
- `isEmpty()` gibt genau dann `true` zurück, wenn `length()` den Wert `0` hat.
- `isBlank()` gibt `true` zurück, wenn der String leer ist oder ausschließlich Whitespace-Zeichen enthält (gemäß `Character.isWhitespace()`, wozu Leerzeichen, Tabs `\t` und Zeilenumbrüche `\n` zählen).
- `s1` ("") hat die Länge 0. Sowohl `isEmpty()` als auch `isBlank()` liefern `true`.
- `s2` ("   ") hat die Länge 3 (nicht leer), enthält aber nur Leerzeichen. `isEmpty()` ist `false`, `isBlank()` ist `true`.
- `s3` ("\n\t") hat die Länge 2, enthält aber nur Steuerzeichen (Whitespaces). `isEmpty()` ist `false`, `isBlank()` ist `true`.
- Die Ausgabe lautet: `true-true false-true false-true`.

---

### Frage 8: String-Verkettung und Null-Werte
Was gibt der folgende Code aus?
```java
String s = null;
s += "test";
System.out.println(s + " " + s.length());
```
- A. `nulltest 8`
- B. `test 4`
- C. Wirft eine `NullPointerException` in Zeile 2.
- D. Wirft eine `NullPointerException` in Zeile 3.

**Antwort: A**
**Erklärung:**
- In Java wandelt die String-Verkettung mit `+` oder `+=` Null-Referenzen automatisch in das String-Literal `"null"` um.
- Im Hintergrund wird `s += "test"` übersetzt in `s = String.valueOf(s) + "test"`, was zu `"null" + "test"` aufgelöst wird.
- Das Ergebnis ist, dass `s` nun auf den String `"nulltest"` zeigt.
- `"nulltest"` hat eine Länge von 8 Zeichen. Da `s` nicht mehr `null` ist, wirft der Aufruf von `s.length()` in Zeile 3 keine Exception, sondern gibt `8` zurück.

---

### Frage 9: Kapazitätsverwaltung bei StringBuilder
Was ist die Ausgabe bei der Ausführung des folgenden Code-Ausschnitts?
```java
StringBuilder sb = new StringBuilder();
System.out.print(sb.capacity() + "-");
sb.ensureCapacity(25);
System.out.print(sb.capacity());
```
- A. `0-25`
- B. `16-25`
- C. `16-34`
- D. `16-16`

**Antwort: C**
**Erklärung:**
- Wenn ein `StringBuilder` ohne Argumente initialisiert wird, erhält er eine Standardkapazität von **16** Zeichen.
- `ensureCapacity(minimumCapacity)` garantiert, dass die interne Puffergröße mindestens dem Wert `minimumCapacity` entspricht.
- Da die aktuelle Kapazität (16) kleiner ist als die angeforderte Kapazität (25), wird die Kapazität nach der Vergrößerungsformel erweitert:
  $$\text{Neue Kapazität} = (\text{Alte Kapazität} \times 2) + 2$$
  $$\text{Neue Kapazität} = (16 \times 2) + 2 = 34$$
- Da 34 größer ist als die geforderten 25, wird die Kapazität auf 34 gesetzt.
- Die Ausgabe lautet `16-34`.

---

### Frage 10: String-Methoden indexOf() und substring()-Grenzen
Was ist die Ausgabe des folgenden Codes?
```java
String sample = "certification";
int index = sample.indexOf("z");
String sub = sample.substring(index);
System.out.println(sub);
```
- A. `certification`
- B. `ertification`
- C. Wirft zur Laufzeit eine `StringIndexOutOfBoundsException`.
- D. Compiliert nicht.

**Antwort: C**
**Erklärung:**
- `sample.indexOf("z")` sucht nach dem Buchstaben `"z"` in `"certification"`. Da dieser nicht gefunden wird, gibt die Methode `-1` zurück.
- In der nächsten Zeile wird `substring(index)` aufgerufen, was zu `substring(-1)` ausgewertet wird.
- Da negative Indizes in Java-Strings ungültig sind, wirft die Methode zur Laufzeit sofort eine `StringIndexOutOfBoundsException`.

---

### Frage 11: Textblöcke und Maskierung von nachfolgenden Leerzeichen
Was ist der Zweck der Escape-Sequenz `\s` in Java-Textblöcken?
```java
String text = """
      Line 1   \s
      Line 2
      """;
```
- A. Sie stellt einen Wagenrücklauf (Carriage Return) dar.
- B. Sie verhindert das Entfernen von nachfolgenden Leerzeichen in dieser Zeile.
- C. Sie fügt ein systemabhängiges Zeilenumbruchzeichen ein.
- D. Sie führt dazu, dass der Compiler einen Syntaxfehler wirft, da `\s` in Textblöcken ungültig ist.

**Antwort: B**
**Erklärung:**
- Standardmäßig entfernt der Java-Compiler alle nachfolgenden Leerzeichen (trailing whitespaces) am Ende einer Zeile in einem Textblock.
- Wenn Sie diese Leerzeichen für Formatierungszwecke erhalten möchten, können Sie am Zeilenende ein `\s` anhängen.
- Der Compiler behält das `\s` (das als einzelnes Leerzeichen aufgelöst wird) sowie alle vorhergehenden Leerzeichen auf dieser Zeile bei.

---

### Frage 12: Übergabe von StringBuilder an Methoden (Seiteneffekte)
Was gibt das folgende Programm aus?
```java
public class BuilderSideEffect {
    public static void modify(StringBuilder s1, String s2) {
        s1.append("A");
        s2 = s2.concat("B");
    }
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("Java");
        String s = "Java";
        modify(sb, s);
        System.out.println(sb + " " + s);
    }
}
```
- A. `Java Java`
- B. `JavaA Java`
- C. `JavaA JavaB`
- D. `Java JavaB`

**Antwort: B**
**Erklärung:**
- Java übergibt Parameter **per Wert (Call-by-Value)**.
- Innerhalb der Methode `modify`:
  - `s1` zeigt auf dasselbe `StringBuilder`-Objekt auf dem Heap wie `sb`. Der Aufruf von `s1.append("A")` mutiert das Objekt direkt. Diese Änderung ist in `main` sichtbar.
  - `s2` ist eine lokale Kopie der Referenz auf das unveränderliche String-Objekt `s`. Die Anweisung `s2.concat("B")` erzeugt ein neues String-Objekt `"JavaB"` und weist dieses `s2` zu. Dadurch wird nur die lokale Parameterkopie `s2` neu zugewiesen. Die ursprüngliche Variable `s` in der `main`-Methode zeigt weiterhin auf `"Java"`.
- Daher lautet das Ergebnis `JavaA Java`.

---

### Frage 13: String replace() vs. replaceAll()
Gegeben ist die folgende Anweisung:
```java
String s = "1a2b3c";
String s1 = s.replace("\\d", "X");
String s2 = s.replaceAll("\\d", "X");
System.out.println(s1 + " " + s2);
```
Was ist das Ergebnis?
- A. `1a2b3c XaXbXc`
- B. `XaXaXa XaXaXa`
- C. `XaXbXc XaXbXc`
- D. `1a2b3c 1a2b3c`

**Antwort: A**
**Erklärung:**
- Die Methode `replace(CharSequence target, CharSequence replacement)` ersetzt literale Vorkommen des Zielstrings. Sie interpretiert **keine** regulären Ausdrücke. Da das Literal `"\\d"` in `"1a2b3c"` nicht vorkommt, findet kein Austausch statt, und `s1` bleibt `"1a2b3c"`.
- Die Methode `replaceAll(String regex, String replacement)` hingegen interpretiert den Zielstring als **regulären Ausdruck (Regex)**. Die Regex `"\\d"` matcht auf jede Ziffer. Daher werden alle Ziffern (`1`, `2`, `3`) durch `"X"` ersetzt, was für `s2` den Wert `"XaXbXc"` ergibt.
- Die Ausgabe lautet `1a2b3c XaXbXc`.

---

### Frage 14: Verwendung der String-Methode join()
Was ist das Ergebnis bei der Ausführung der folgenden Zeile?
```java
String joined = String.join("-", "a", "b", "c");
System.out.println(joined);
```
- A. `a-b-c`
- B. `-a-b-c`
- C. `a-b-c-`
- D. Compiliert nicht, da `String.join` nur Arrays akzeptiert.

**Antwort: A**
**Erklärung:**
- `String.join(CharSequence delimiter, CharSequence... elements)` ist eine statische Hilfsmethode, die in Java 8 hinzugefügt wurde.
- Sie akzeptiert einen Varargs-Parameter für die Elemente. Das bedeutet, dass Sie einzelne Strings direkt oder ein Array/eine Collection übergeben können.
- Sie verbindet die Elemente mit dem angegebenen Trennzeichen, fügt das Trennzeichen jedoch **nicht** am Anfang oder Ende der Gesamtzeichenkette ein.
- Die Ausgabe ist `a-b-c`.

---

### Frage 15: String repeat()-Methode
Was ist die Ausgabe der folgenden Anweisung?
```java
String s = "12".repeat(3);
System.out.println(s);
```
- A. `121212`
- B. `12 12 12`
- C. Compiliert nicht, da `repeat` keine Methode von `String` ist.
- D. Wirft zur Laufzeit eine Exception.

**Antwort: A**
**Erklärung:**
- Die Methode `repeat(int count)` wurde in Java 11 eingeführt.
- Sie gibt einen String zurück, der dem aneinandergehängten Ausgangsstring entspricht, welcher `count`-mal wiederholt wurde.
- Wenn `count` den Wert `0` hat, wird ein leerer String zurückgegeben. Ist `count` negativ, wird eine `IllegalArgumentException` geworfen.
- In diesem Fall wird `"12"` dreimal wiederholt, was `"121212"` ergibt.

---

### Frage 16: CharAt() außerhalb der Grenzen
Was ist das Ergebnis des Versuchs, den folgenden Code zu compilieren und auszuführen?
```java
String s = "Java";
char c = s.charAt(4);
System.out.println(c);
```
- A. Gibt ein Leerzeichen aus.
- B. Gibt `a` aus.
- C. Wirft zur Laufzeit eine `StringIndexOutOfBoundsException`.
- D. Compiliert nicht.

**Antwort: C**
**Erklärung:**
- String-Indizes sind 0-basiert.
- Der String `"Java"` hat eine Länge von 4.
- Gültige Indizes sind `0`, `1`, `2` und `3`.
- Der Versuch, über `charAt(4)` auf Index `4` zuzugreifen, führt zur Laufzeit zu einer `StringIndexOutOfBoundsException`.

---

### Frage 17: Nachfolgende Leerzeilen in Textblöcken
Gegeben ist die folgende Textblock-Deklaration:
```java
String text = """
      First
      Second
      
      """;
```
Wie viele Zeilen sind im resultierenden String `text` enthalten?
- A. 2
- B. 3
- C. 4
- D. 5

**Antwort: B**
**Erklärung:**
- Zählen wir die Zeilen, die im Textblock definiert sind:
  - Zeile 1: `      First` (gefolgt von Zeilenumbruch)
  - Zeile 2: `      Second` (gefolgt von Zeilenumbruch)
  - Zeile 3: (eine leere Zeile vor den schließenden Anführungszeichen, gefolgt von Zeilenumbruch)
  - Zeile 4: `      ` (Die Zeile mit den schließenden Anführungszeichen `"""`)
- Da die schließenden Anführungszeichen `"""` in einer eigenen Zeile stehen, markieren sie das Ende des Inhalts, aber der Zeilenumbruch nach der leeren Zeile 3 wird in das Ergebnis übernommen.
- Somit enthält der String: `"First\nSecond\n\n"`.
- Dies entspricht genau 3 Zeilen Textinhalt (wobei die letzte Zeile leer ist).

---

### Frage 18: Präzedenz bei der String-Verkettung
Was ist die Ausgabe der folgenden Anweisung?
```java
System.out.println(1 + 2 + "3" + 4 + 5);
```
- A. `12345`
- B. `3345`
- C. `339`
- D. `1239`

**Antwort: B**
**Erklärung:**
- Operatoren werden von links nach rechts ausgewertet.
- Schritt 1: `1 + 2` ist eine numerische Addition und ergibt `3`.
- Schritt 2: `3 + "3"` enthält einen String, sodass die numerische `3` in einen String `"3"` konvertiert und angehängt wird, was `"33"` ergibt.
- Schritt 3: `"33" + 4` führt eine String-Verkettung aus und ergibt `"334"`.
- Schritt 4: `"334" + 5` führt eine String-Verkettung aus und ergibt `"3345"`.
- Die Ausgabe lautet `3345`.

---

### Frage 19: Speicherlayout kompakter Strings (Compact Strings)
Welche der folgenden Aussagen trifft auf die interne Speicherung von Strings in modernen Java-Versionen (Java 9 und neuer) zu?
- A. Sie werden als ein Array von `char` (16-Bit-Zeichen) gespeichert.
- B. Sie werden dynamisch als ein `byte[]`-Array in Kombination mit einem Codierungs-Flag-Byte (Latin1 vs. UTF-16) gespeichert, um den Speicherbedarf zu reduzieren.
- C. Sie werden automatisch mit gzip komprimiert.
- D. Sie werden in einem verschlüsselten Byte-Array gespeichert, um Metaspace-Leaks zu verhindern.

**Antwort: B**
**Erklärung:**
- Vor Java 9 wurden Strings intern als `char[]`-Arrays gespeichert, was 2 Bytes (16 Bit) für jedes Zeichen beanspruchte.
- Seit Java 9 wurde das Feature **Compact Strings** eingeführt. Die interne Repräsentation ist nun ein `byte[]`-Array, begleitet von einem einzelnen `coder`-Feldbyte.
- Wenn ein String nur Latin-1-Zeichen enthält (die mit 1 Byte dargestellt werden können), wird er mit 1 Byte pro Zeichen gespeichert.
- Wenn er Zeichen enthält, die UTF-16 erfordern, fällt er auf 2 Bytes pro Zeichen zurück. Dies halbiert den Speicherbedarf für die meisten westlichen Textanwendungen.

---

### Frage 20: Strip() vs. Trim()
Was ist der Hauptunterschied zwischen `String.trim()` und `String.strip()`?
- A. `trim()` ist schneller, aber unsicher, wohingegen `strip()` threadsicher ist.
- B. `trim()` entfernt nur englische Leerzeichen (ASCII-Wert <= 0x20), wohingegen `strip()` Unicode-aware ist und alle Unicode-Whitespace-Zeichen entfernt.
- C. `strip()` entfernt nur führende Leerzeichen, während `trim()` sowohl führende als auch nachfolgende Leerzeichen entfernt.
- D. Es gibt keinen Unterschied; `strip()` ist lediglich ein Alias für `trim()`.

**Antwort: B**
**Erklärung:**
- `String.trim()` existiert in Java seit Version 1.0. Sie definiert Whitespaces als jedes Zeichen, dessen Codepoint kleiner oder gleich `U+0020` (das ASCII-Leerzeichen) ist. Sie erkennt keine Unicode-spezifischen Leerzeichen (wie das geschützte Leerzeichen oder das Geviertzeichen).
- `String.strip()` wurde in Java 11 hinzugefügt. Sie arbeitet vollständig **Unicode-basiert** und verwendet `Character.isWhitespace(int)`, um zu bestimmen, welche Zeichen entfernt werden sollen. Sie verarbeitet moderne Unicode-Leerzeichen-Standards korrekt und ist die empfohlene Methode für moderne Anwendungen.
