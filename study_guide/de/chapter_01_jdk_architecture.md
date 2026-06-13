# Kapitel 1: JDK-Architektur, Kompilierung & Ausführung

## 1. Kernziele der Java 21 Prüfung
- Verstehen der Java-Komponenten: JDK, JRE und JVM.
- Beschreibung des Java-Kompilierungs- und Ausführungslebenszyklus.
- Erkennen korrekter Signaturen der `main`-Methode.
- Erklären des JVM-Klassenladens und der Klassenausführung.

---

## 2. Detaillierte Konzepte

### JDK vs. JRE vs. JVM
Die Java-Architektur ist in drei Schichten unterteilt, die jeweils einer bestimmten Phase des Entwicklungs- und Ausführungslebenszyklus dienen:
1. **JVM (Java Virtual Machine):** Die Kern-Laufzeit-Engine. Sie ist verantwortlich für die Ausführung von Bytecode, die Speicherverwaltung (Garbage Collection) und die Interaktion mit dem Host-Betriebssystem. Die JVM ist plattformabhängig (es gibt unterschiedliche JVM-Builds für Windows, macOS und Linux).
2. **JRE (Java Runtime Environment):** Eine Verpackungsschicht, die die JVM sowie die Kernbibliotheken und Ressourcen enthält, die zum *Ausführen* kompilierter Java-Programme erforderlich sind. Sie enthält keine Entwicklungswerkzeuge wie Compiler.
3. **JDK (Java Development Kit):** Das vollständige Softwareentwicklungspaket. Es enthält die JRE sowie Werkzeuge, die zum Kompilieren, Debuggen und Verpacken von Java-Programmen benötigt werden, einschließlich:
   - `javac`: Der Java-Compiler.
   - `jar`: Das Archivierungswerkzeug.
   - `jcmd`, `jdb`, `jconsole`: Diagnose- und Debugging-Tools.

```
+--------------------------------------------------------+
| JDK (Java Development Kit)                             |
|   +--------------------------------------------------+ |
|   | JRE (Java Runtime Environment)                   | |
|   |   +-------------------+  +---------------------+ | |
|   |   | JVM               |  | Kernbibliotheken &  | | |
|   |   | (Runtime Engine)  |  | Ressourcen          | | |
|   |   +-------------------+  +---------------------+ | |
|   +--------------------------------------------------+ |
|   | Entwicklungswerkzeuge (javac, jar, jcmd, etc.)   | |
|+-------------------------------------------------------+
```

### Der Kompilierungs- und Ausführungslebenszyklus
Java nutzt einen zweistufigen Übersetzungsprozess, um Plattformunabhängigkeit ("Write Once, Run Anywhere") zu erreichen:
1. **Kompilierung (Entwicklungszeit / Compile Time):** 
   - Quellcode (`.java`-Dateien) wird vom Compiler (`javac`) analysiert.
   - Der Compiler überprüft die Syntax und die Typensicherheit zur Compilezeit.
   - Er erzeugt plattformunabhängigen **Bytecode** (`.class`-Dateien).
2. **Ausführung (Laufzeit / Runtime):**
   - Die JVM liest den Bytecode (`.class`-Datei).
   - Der ClassLoader (Klassenlader) lädt die benötigten Klassen.
   - Der JVM-**Interpreter** liest die Bytecode-Instruktionen sequenziell und übersetzt sie in nativen Maschinencode.
   - Der **JIT-Compiler (Just-In-Time)** identifiziert "Hot Spots" (häufig ausgeführte Codeblöcke) und kompiliert sie direkt in native Maschinenbefehle, um die Leistung zu optimieren.

---

## 3. JVM-Interna & Speicherlayout

### Lebenszyklus des Klassenladens (Class Loading)
Wenn ein Java-Programm startet, lädt die JVM Klassen dynamisch. Dieser Prozess besteht aus drei Hauptphasen:
1. **Loading (Laden):** Die JVM liest die binäre Repräsentation der Klasse (die `.class`-Datei) und erstellt ein `java.lang.Class`-Objekt im Metaspace.
2. **Linking (Verknüpfen):**
   - **Verification (Verifizierung):** Überprüft die strukturelle Korrektheit des Bytecodes, um sicherzustellen, dass er keine Sicherheitsbeschränkungen der JVM verletzt.
   - **Preparation (Vorbereitung):** Reserviert Speicherplatz für statische Felder und initialisiert diese mit ihren Standardwerten (z. B. `0`, `0.0`, `false`, `null`). *Hinweis: Benutzerdefinierte Initialisierer werden hier noch nicht ausgeführt.*
   - **Resolution (Auflösung):** Übersetzt symbolische Referenzen im Konstantenpool in direkte Referenzen (Speicherzeiger) innerhalb des Metaspace.
3. **Initialization (Initialization):** Führt statische Initialisierungsblöcke und statische Feldinitialisierer aus. Erst danach ist die Klasse vollständig initialisiert.

```
+-------------------------------------------------------+
| JVM CLASS LOADING LIFECYCLE                           |
|                                                       |
| 1. Loading       -->  Liest .class-Datei in Metaspace |
| 2. Linking                                            |
|    - Verification -->  Prüft Bytecode-Korrektheit     |
|    - Preparation  -->  Reserviert statischen Speicher  |
|                        (initialisiert mit Standardw.) |
|    - Resolution   -->  Löst symbolische Referenzen auf|
| 3. Initialization-->  Führt stat. Initialisierer aus  |
+-------------------------------------------------------+
```

### Die Regeln der `main`-Methode
Damit eine Klasse als Einstiegspunkt (Entry Point) dienen kann, sucht die JVM nach einer ganz bestimmten Methodensignatur. Die JVM sucht nach:
- **`public`**: Zugänglich von außerhalb des Klassenpakets (wird von der JVM-Laufzeit aufgerufen).
- **`static`**: Ausführbar, ohne eine Instanz der Klasse zu erstellen.
- **`void`**: Gibt keinen Wert an die JVM zurück.
- **`main`**: Der exakte kleingeschriebene Name.
- **`String[] args`** or **`String... args`**: Array von String-Argumenten (Varargs).

#### Gültige Signaturen:
- `public static void main(String[] args)`
- `public static void main(String... args)`
- `static public void main(String[] args)` (Die Zugriffsmodifizierer können in beliebiger Reihenfolge stehen, obwohl `public static` Konvention ist).
- `public static final void main(String[] args)` (`final` ist erlaubt, wird aber selten verwendet).

#### Ungültige Signaturen (Kompilieren fehlerfrei, werfen aber zur Laufzeit eine `NoSuchMethodError` der JVM):
- `public void main(String[] args)` (Nicht statisch)
- `static void main(String[] args)` (Nicht öffentlich)
- `public static int main(String[] args)` (Gibt `int` statt `void` zurück)
- `public static void main(String args)` (Parameter ist `String`, kein Array oder Vararg)
- `public static void Main(String[] args)` (Großgeschriebenes `M` in `Main`)

---

## 4. Knifflige OCP-Prüfungsfragen

### Frage 1: Plattformunabhängigkeit und JVM/JDK-Komponenten
Welche der folgenden Aussagen beschreiben die Plattformunabhängigkeit von Java und die Verteilung von Werkzeugen auf JDK, JRE und JVM korrekt? (Wählen Sie alle zutreffenden Antworten aus)
- A. Java-Bytecode (.class) ist plattformabhängig, da er speziell für Windows, Linux oder macOS generiert werden muss.
- B. Die JVM ist plattformabhängig; für verschiedene Betriebssysteme und CPU-Architekturen muss eine jeweils andere JVM-Implementierung installiert werden.
- C. Die JRE enthält Entwicklungswerkzeuge wie `javac` (den Java-Compiler) und `jar` (das Archivierungswerkzeug).
- D. Java-Bytecode ist plattformunabhängig, und dieselbe `.class`-Datei kann auf jeder Plattform ausgeführt werden, solange eine kompatible JVM installiert ist.
- E. Das JDK enthält sowohl die JRE als auch Entwicklungswerkzeuge, was es zu einer Obermenge der JRE macht.

**Answer: B, D, E**
**Detailed Explanation (German):**
- **A ist falsch:** Java-Bytecode (`.class`-Dateien) ist völlig plattformunabhängig. Der Compiler (`javac`) analysiert den Quellcode und erzeugt standardisierten Bytecode, der der JVM-Spezifikation entspricht, unabhängig davon, auf welchem Betriebssystem der Compiler ausgeführt wird.
- **B ist korrekt:** Die JVM (Java Virtual Machine) übersetzt Bytecode zur Laufzeit in native Maschinenbefehle. Da sich der native Maschinencode zwischen Betriebssystemen (z. B. Windows vs. macOS) und CPU-Architekturen (z. B. x86_64 vs. ARM64) unterscheidet, muss die JVM selbst plattformabhängig sein.
- **C ist falsch:** Die JRE (Java Runtime Environment) enthält nur die Komponenten, die zum *Ausführen* von Java-Anwendungen erforderlich sind (die JVM und Kernbibliotheken). Entwicklungswerkzeuge wie `javac`, `jar` und Debugger sind strikt Teil des JDK (Java Development Kit).
- **D ist korrekt:** Dies ist das EXP-Prinzip von "Write Once, Run Anywhere" (WORA). Der Bytecode ist universell; die lokale JVM übernimmt die Übersetzung in OS-spezifische Befehle.
- **E ist korrekt:** Das JDK enthält die JRE (um Entwicklern das Ausführen von Java-Programmen zu ermöglichen) sowie die für die Entwicklung erforderlichen Werkzeuge.

---

### Frage 2: Signaturen der Main-Methode
Welche der folgenden Code-Ausschnitte können von der JVM direkt als gültiger Einstiegspunkt ausgeführt werden? (Wählen Sie alle zutreffenden Antworten aus)
```java
// Snippet I
public class Entry1 {
    public static final void main(String... args) {
        System.out.println("Entry1");
    }
}

// Snippet II
public class Entry2 {
    static public synchronized void main(String[] arguments) {
        System.out.println("Entry2");
    }
}

// Snippet III
class Entry3 {
    public static void main(String args) {
        System.out.println("Entry3");
    }
}

// Snippet IV
public class Entry4 {
    public static void main(java.lang.String[] args) {
        System.out.println("Entry4");
    }
}
```
- A. Nur Snippet I und II
- B. Nur Snippet I, II und IV
- C. Snippet I, II, III und IV
- D. Nur Snippet I und IV

**Answer: B**
**Detailed Explanation (German):**
- **Snippet I (Gültig):** Die JVM sucht nach `public static void main(String[] args)`. 
  - Das Schlüsselwort `final` ist in der Signatur der `main`-Methode zulässig; es verhindert lediglich das Überschreiben, was die JVM nicht daran hindert, sie aufzurufen.
  - Varargs (`String... args`) werden zu einem Standard-`String[]`-Array kompiliert, sodass die JVM diese Signatur erkennt.
- **Snippet II (Gültig):** 
  - Zugriffsmodifizierer und Methodenmodifizierer können in beliebiger Reihenfolge vor dem Rückgabetyp stehen. Daher ist `static public synchronized void main` akzeptabel. Der Modifizierer `synchronized` ist zulässig (wenn auch hier selten verwendet).
  - Der Parametername muss nicht `args` sein; `arguments` ist völlig in Ordnung.
- **Snippet III (Ungültig):** Der Parametertyp muss ein Array von `String` oder ein Vararg von `String` sein. Hier handelt es sich um einen einzelnen `String` (`String args`). Obwohl dies kompiliert wird, führt das Ausführen zur Laufzeit zu einem `NoSuchMethodError`, da die JVM den Standardeinstiegspunkt nicht finden kann.
- **Snippet IV (Gültig):** `java.lang.String[]` ist der vollqualifizierte Name der Klasse `String`. Der Compiler und die JVM lösen dies identisch zu `String[]` auf.

---

### Frage 3: Kompilierung und Ausführung von Single-File-Quellcodeprogrammen
Seit Java 11 (und verfeinert in späteren Versionen) können Sie eine einzelne Java-Quellcodedatei direkt mit dem `java`-Launcher ausführen (z. B. `java MyClass.java`). Welche der folgenden Aussagen ist bezüglich dieses Features WAHR?
- A. Der `java`-Befehl kompiliert die Datei in eine `.class`-Datei auf der Festplatte und führt sie dann aus.
- B. Die Quelldatei muss denselben Namen haben wie die darin definierte öffentliche Klasse, genau wie bei der normalen Kompilierung.
- C. Der Code wird im Speicher kompiliert und ausgeführt; es wird keine `.class`-Datei auf der Festplatte erzeugt.
- D. Sie können mit diesem Befehl ein Projekt aus mehreren Dateien ausführen, solange sie sich im selben Verzeichnis befinden.

**Answer: C**
**Detailed Explanation (German):**
- **A ist falsch / C ist korrekt:** Der Single-File-Source-Code-Launcher kompiliert den Code direkt in den Arbeitsspeicher. Er schreibt keine `.class`-Dateien in das Dateisystem, wodurch der Arbeitsbereich sauber bleibt.
- **B ist falsch:** Beim Starten eines Single-File-Programms führt der Launcher die erste in der Quelldatei definierte Klasse aus, unabhängig davon, ob ihr Name mit dem Dateinamen übereinstimmt. Wenn beispielsweise `java Test.java` die Klasse `public class Runner { ... }` als erste Klasse enthält, wird sie ausgeführt.
- **D ist falsch:** Der Single-File-Launcher kompiliert und führt nur die angegebene Quelldatei aus. Wenn sich die Datei auf andere benutzerdefinierte Klassen bezieht, die nicht kompiliert wurden oder sich nicht im Classpath befinden, schlägt die Ausführung mit einem Kompilierungsfehler zur Laufzeit fehl.

---

### Frage 4: Phasen des dynamischen Klassenladens
In welcher Phase des JVM-Klassenlade-Lebenszyklus wird statischen Variablen Speicher zugewiesen und werden diese mit ihren Standardwerten (z. B. `0`, `false`, `null`) initialisiert?
- A. Loading (Laden)
- B. Verification (Verifizieren)
- C. Preparation (Vorbereiten)
- D. Initialization (Initialisieren)

**Answer: C**
**Detailed Explanation (German):**
- **Loading (A):** Die JVM liest den binären Bytecode-Stream für eine Klasse und erstellt ein `java.lang.Class`-Objekt im Metaspace.
- **Verification (B):** Dies ist der erste Schritt der Verknüpfungsphase (Linking), in dem die JVM sicherstellt, dass der Bytecode gültig und strukturell einwandfrei ist und keine Sicherheitsrichtlinien verletzt.
- **Preparation (C):** Für statische Felder der Klasse wird Speicherplatz reserviert und sie werden mit den Standardwerten für ihre jeweiligen Typen initialisiert (z. B. `0` für numerische Primitive, `false` für Booleans, `null` für Objektreferenzen). Echte Werte, die im Code deklariert sind (z. B. `public static int x = 42;`), werden hier noch nicht zugewiesen.
- **Initialization (D):** Dies ist die Phase, in der statische Variablen-Initialisierer (wie die Zuweisung von `42` an `x`) und statische Block-Initialisierer (`static { ... }`) in der Reihenfolge ausgeführt werden, in der sie im Quellcode erscheinen.

---

### Frage 5: Ausführungsreihenfolge von Initialisierern
Was ist die Ausgabe beim Ausführen der folgenden Java-Anwendung?
```java
public class InitOrder {
    static {
        System.out.print("A ");
    }
    {
        System.out.print("B ");
    }
    public InitOrder() {
        System.out.print("C ");
    }
    public static void main(String[] args) {
        System.out.print("D ");
        new InitOrder();
        new InitOrder();
    }
}
```
- A. A D B C B C
- B. D A B C B C
- C. A B C D B C
- D. A D C B C B

**Answer: A**
**Detailed Explanation (German):**
1. Wenn die JVM startet, lädt sie die Klasse, die die `main`-Methode enthält (`InitOrder`).
2. Während der **Initialisierungsphase** des Klassenladevorgangs werden statische Variablen und statische Blöcke in der Reihenfolge ihrer Deklaration ausgeführt. Daher läuft der statische Block `static { System.out.print("A "); }` zuerst und gibt `A ` aus.
3. Die JVM führt dann die `main`-Methode aus. Die erste Anweisung in `main` ist `System.out.print("D ");`, was `D ` ausgibt.
4. Als nächstes wird `new InitOrder()` aufgerufen, um die Klasse zu instanziieren:
   - Konstruktoren/Initialisierer der Superklasse laufen zuerst (hier `java.lang.Object`).
   - Instanzinitialisierer und Instanzvariablen-Initialisierer der Klasse laufen in der Reihenfolge ihrer Deklaration. Der Block `{ System.out.print("B "); }` läuft und gibt `B ` aus.
   - Der Konstruktorkörper läuft: `System.out.print("C ");`, was `C ` ausgibt.
5. Eine zweite Instanz von `InitOrder` wird über `new InitOrder()` erstellt. Beachte, dass statische Initialisierer **nicht** erneut ausgeführt werden (sie laufen genau einmal pro Lebenszeit des Classloaders).
   - Instanzinitialisierer laufen: gibt `B ` aus.
   - Konstruktor läuft: gibt `C ` aus.
Zusammengefasste Ausgabe: `A D B C B C`.

---

### Frage 6: Class-Loader-Hierarchie
Welcher Java-Klassenlader ist für das Laden der Kern-Laufzeitklassen (wie Klassen im `java.base`-Modul, z. B. `java.lang.Object`, `java.lang.String`) verantwortlich?
- A. Application Class Loader (System Class Loader)
- B. Platform Class Loader (Extension Class Loader)
- C. Bootstrap Class Loader
- D. Dynamic Class Loader

**Answer: C**
**Detailed Explanation (German):**
- **Bootstrap Class Loader (C):** Dies ist der übergeordnete Klassenlader (Parent Class Loader) aller Klassenlader. Er ist in den JVM-Kern integriert und lädt kritische Laufzeitklassen aus den JDK-Basismodulen (wie `java.base`). In modernen JDKs gibt er `null` zurück, wenn er in Java dargestellt wird (z. B. `String.class.getClassLoader()` gibt `null` zurück).
- **Platform Class Loader (B):** (Früher Extension Class Loader in älteren Java-Versionen). Er lädt plattformspezifische Java SE-Klassen und Erweiterungs-APIs.
- **Application Class Loader (A):** Auch bekannt als System Class Loader, lädt er Klassen aus dem Anwendungs-Classpath (definiert durch `-cp` oder `--class-path`).
- **Dynamic Class Loader (D):** Dies ist kein standardmäßiger integrierter JVM-Klassenlader.

---

### Frage 7: Semantik von System.gc()
Welche der folgenden Aussagen beschreibt die Garantie, die durch den Aufruf von `System.gc()` in einem Java-Programm gegeben wird?
- A. Er garantiert, dass der Garbage Collector sofort ausgeführt wird und alle nicht verwendeten Objekte freigibt.
- B. Er garantiert, dass die JVM einen vollständigen Garbage-Collection-Zyklus ausführt, bevor die Methode zurückkehrt.
- C. Er schlägt der JVM vor, Ressourcen für das Recycling nicht verwendeter Objekte aufzuwenden, bietet jedoch keine Garantie dafür, dass der Garbage Collector tatsächlich ausgeführt wird.
- D. Er pausiert alle Anwendungsthreads, bis die Heap-Auslastung unter 50 % sinkt.

**Answer: C**
**Detailed Explanation (German):**
- Der Aufruf von `System.gc()` (oder `Runtime.getRuntime().gc()`) ist lediglich ein **Hinweis** (Hint) oder Vorschlag an die JVM, dass es ein guter Zeitpunkt für die Garbage Collection sein könnte.
- Es steht der JVM frei, diese Anforderung vollständig zu ignorieren. Moderne Garbage Collector optimieren ihre Sammlungszyklen autonom. Das manuelle Aufrufen gilt als schlechte Praxis, da es teure Stop-the-World-Sammlungen auslösen kann, wenn die JVM sich entscheidet, dem Hinweis zu folgen, oder gar nichts tut.

---

### Frage 8: Befehlszeilenoptionen für den Classpath
Angenommen, Sie haben eine kompilierte Klassendatei `Main.class` innerhalb der Paketverzeichnisstruktur `com/study/helper/Main.class`. Der absolute Pfad zum Wurzelverzeichnis, das `com` enthält, lautet `/app/classes`. Welcher Befehl führt die Anwendung korrekt aus?
- A. `java /app/classes/com/study/helper/Main`
- B. `java -cp /app/classes Main`
- C. `java -cp /app/classes com.study.helper.Main`
- D. `java -cp /app/classes/com/study/helper Main`

**Answer: C**
**Detailed Explanation (German):**
- Wenn eine Klasse ausgeführt wird, die zu einem Paket gehört, muss dem `java`-Werkzeug der vollqualifizierte Klassenname (FQCN) übergeben werden, der `com.study.helper.Main` lautet.
- Der Classpath (`-cp` oder `--class-path`) muss auf das **Wurzelverzeichnis** zeigen, in dem die Paketstruktur beginnt, also `/app/classes`.
- Die JVM hängt die Paketverzeichnisstruktur an die Classpath-Wurzel an, um nach der `.class`-Datei zu suchen: `/app/classes` + `com/study/helper/Main.class`.
- **A ist falsch:** Sie können keinen Dateipfad übergeben, um kompilierten Bytecode direkt auszuführen.
- **B ist falsch:** Der vollqualifizierte Klassenname (FQCN) fehlt.
- **D ist falsch:** Der Classpath zeigt direkt auf das Blattverzeichnis, was bedeutet, dass die JVM nach einer Klasse namens `Main` ohne Paket in diesem Ordner sucht. Da `Main.class` jedoch einen Paket-Header enthält (`package com.study.helper;`), führt dies zur Laufzeit zu einem `NoClassDefFoundError`.

---

### Frage 9: Statische Importe
Betrachten Sie die folgende Datei `Calculator.java`:
```java
package com.math;
public class Calculator {
    public static int add(int a, int b) { return a + b; }
}
```
Und eine weitere Datei `App.java`:
```java
package com.app;
// INSERT IMPORT HERE
public class App {
    public static void main(String[] args) {
        System.out.println(add(5, 10));
    }
}
```
Welche der folgenden Zeilen können bei `// INSERT IMPORT HERE` eingefügt werden, damit `App.java` erfolgreich kompiliert? (Wählen Sie alle zutreffenden Antworten aus)
- A. `import com.math.Calculator.add;`
- B. `import static com.math.Calculator.add;`
- C. `import static com.math.Calculator.*;`
- D. `import com.math.Calculator.*;`
- E. `static import com.math.Calculator.add;`

**Answer: B, C**
**Detailed Explanation (German):**
- Um statische Mitglieder (wie Methoden oder Felder) einer Klasse so zu importieren, dass sie ohne ihren Klassennamen-Qualifizierer referenziert werden können, muss die Syntax `import static <vollqualifizierter-klassenname>.<mitgliedsname>;` oder `import static <vollqualifizierter-klassenname>.*;` verwendet werden.
- **A ist falsch:** Der Standard-`import` wird zum Importieren von Klassen/Interfaces verwendet, nicht für einzelne Methoden oder statische Felder.
- **B ist korrekt:** Importiert gezielt die statische Methode `add`.
- **C ist korrekt:** Wildcard-Static-Import, der alle statischen Mitglieder von `Calculator` importiert.
- **D ist falsch:** Dies importiert die Klassen innerhalb des Pakets `com.math.Calculator` (was syntaktisch ungültig ist, da `Calculator` eine Klasse und kein Paket ist).
- **E ist falsch:** Die Syntax lautet `import static`, nicht `static import`.

---

### Frage 10: JVM-Speicherbereiche – Metaspace vs. Heap vs. Stack
Wo speichert die JVM in Java 21 Klassenmetadaten (wie Klassendefinitionen, Methoden-Bytecode, Annotationen und den Konstantenpool)?
- A. Java-Heap
- B. Metaspace
- C. Java-Stack (Thread-Stack)
- D. Garbage Collection Root

**Answer: B**
**Detailed Explanation (German):**
- **Metaspace (B):** Seit Java 8 werden Klassenmetadaten im nativen Speicher gespeichert, der als **Metaspace** bekannt ist. Im Gegensatz zum Heap weist der Metaspace Speicherplatz direkt aus dem lokalen Speicher des Betriebssystems zu und wächst standardmäßig dynamisch, sofern er nicht durch JVM-Argumente (z. B. `-XX:MaxMetaspaceSize`) begrenzt wird.
- **Heap (A):** Speichert Instanzen von Objekten und Arrays.
- **Java Stack (C):** Speichert lokale Variablen, Referenzvariablen, die auf den Heap zeigen, und Frames für aktive Methodenaufrufe auf Thread-Basis.
- **Garbage Collection Root (D):** Dies ist ein konzeptionelles Element (wie lokale Variablen, aktive Threads, JNI-Referenzen), das vom GC-Algorithmus verwendet wird, um lebende Objekte zu verfolgen, kein physischer Datenspeicherbereich.

---

### Frage 11: Überladen der Main-Methode
Welches Verhalten zeigt das folgende Programm, wenn es kompiliert und mit `java MainOverload` ausgeführt wird?
```java
public class MainOverload {
    public static void main(String[] args) {
        System.out.print("A ");
        main("B");
    }
    public static void main(String arg) {
        System.out.print(arg + " ");
    }
    public static void main(String[] args, int extra) {
        System.out.print("C ");
    }
}
```
- A. Das Programm kompiliert aufgrund des doppelten Methodennamens `main` nicht.
- B. Das Programm kompiliert und läuft und gibt Folgendes aus: `A B `
- C. Das Programm kompiliert und läuft und gibt Folgendes aus: `A B C `
- D. Das Programm kompiliert, wirft aber zur Laufzeit einen `NoSuchMethodError`.

**Answer: B**
**Detailed Explanation (German):**
- Wie jede andere Java-Methode kann auch die `main`-Methode mit unterschiedlichen Parameterlisten **überladen** werden.
- Die JVM sucht gezielt nach der Signatur des Einstiegspunkts, die auf `main(String[] args)` (oder Varargs) passt, und startet diese Methode zuerst.
- In `main(String[] args)` gibt der Code `A ` aus und ruft dann `main("B")` auf.
- Der Aufruf `main("B")` entspricht der überladenen Methodensignatur `main(String arg)`, da `"B"` ein einzelner `String` ist. Diese Methode wird ausgeführt und gibt `B ` aus.
- `main(String[] args, int extra)` wird nie aufgerufen, da kein Code existiert, der sie aufruft.
- Daher lautet die Ausgabe `A B `.

---

### Frage 12: Bytecode-Kompatibilität und Major-Version-Fehler
Sie haben eine Java-Quellcodedatei mit dem Java 21-Compiler `javac` kompiliert, die auf die Klassendateiversion 21 abzielt. Wenn Sie versuchen, diese `.class`-Datei auf einer Maschine mit einer Java 17-Laufzeitumgebung (JRE) auszuführen, was ist das Ergebnis?
- A. Die Klasse wird erfolgreich ausgeführt, da Java-Bytecode abwärtskompatibel ist.
- B. Die JVM wirft zur Laufzeit einen `java.lang.UnsupportedClassVersionError`.
- C. Die Klasse läuft, wirft aber beim ersten Laden der Klasse einen `InstantiationError`.
- D. Der Compiler wirft einen Compilezeit-Fehler.

**Answer: B**
**Detailed Explanation (German):**
- Java behält die **Abwärtskompatibilität** bei: Ältere `.class`-Dateien (kompiliert mit älteren JDKs) können auf neueren JVMs ausgeführt werden.
- Java unterstützt jedoch keine **Aufwärtskompatibilität**: Neuerere `.class`-Dateien (kompiliert mit neueren JDKs, die auf neuere Bytecode-Ebenen abzielen) können nicht auf älteren JVMs ausgeführt werden.
- Wenn eine ältere JVM (wie Java 17) die Major/Minor-Versions-Header in einer Klassendatei liest, die von einem neueren Compiler (wie Java 21) generiert wurde, lehnt sie die Datei ab und wirft einen `java.lang.UnsupportedClassVersionError` (eine Unterklasse von `java.lang.LinkageError`).

---

### Frage 13: Verhalten des Befehls `java` vs. `javac`
Betrachten Sie die folgende Befehlsausführung auf einem sauberen System:
`javac -d bin src/com/helper/Worker.java`
Welche der folgenden Aussagen beschreibt die Ausgabe und das Verhalten dieses Befehls?
- A. Es kompiliert `Worker.java` und gibt die resultierende `.class`-Datei direkt im `bin`-Verzeichnis als `bin/Worker.class` aus.
- B. Es kompiliert `Worker.java` und legt die kompilierte Ausgabe unter `bin/com/helper/Worker.class` ab.
- C. Es führt die Anwendung `Worker.java` aus und leitet stdout in das `bin`-Verzeichnis um.
- D. Es erstellt ein Paket namens `bin` und fügt eine Abhängigkeit in `Worker.java` hinzu.

**Answer: B**
**Detailed Explanation (German):**
- Das Flag `-d` im `javac`-Compiler gibt das **Zielverzeichnis** (Destination Directory) für kompilierte Klassendateien an.
- Wenn die Quelldatei ein Paket deklariert (z. B. `package com.helper;`), erstellt der Compiler die Paketordnerstruktur automatisch unter dem Zielverzeichnis neu.
- Daher wird die generierte Datei unter `bin/com/helper/Worker.class` gespeichert. Dies erleichtert die Organisation von Builds und die Classpath-Kompilierung.

---

### Frage 14: Paketkonflikte bei Single-File-Quellcode
Sie haben eine einzelne Java-Quellcodedatei namens `Demo.java`, die den folgenden Code enthält:
```java
package com.demo;
public class Demo {
    public static void main(String[] args) {
        System.out.println("Running Demo");
    }
}
```
Wenn Sie diese Datei vom Terminal aus mit `java Demo.java` ausführen, was passiert?
- A. Die Kompilierung schlägt fehl, da ein Single-File-Programm keine `package`-Deklaration enthalten darf.
- B. Es kompiliert im Speicher und gibt `Running Demo` aus.
- C. Es kompiliert, wirft aber einen `NoClassDefFoundError`, da die Paketdeklaration nicht mit der Verzeichnisstruktur auf der Festplatte übereinstimmt.
- D. Es gibt `Running Demo` aus, zeigt jedoch eine Warnung bezüglich der Paketkonformität an.

**Answer: B**
**Detailed Explanation (German):**
- Bei Verwendung des Single-File-Source-Code-Launchers (`java Demo.java`) ist eine Paketdeklaration **erlaubt**.
- Im Gegensatz zur standardmäßigen Classpath-basierten Ausführung, bei der Paketnamen direkt mit Verzeichnissen auf der Festplatte übereinstimmen müssen, führt der Single-File-Launcher den im Speicher kompilierten Bytecode direkt aus, ohne die Verzeichnisverschachtelung zu prüfen.
- Daher kompiliert er erfolgreich und gibt `Running Demo` aus.

---

### Frage 15: Ausführbare JAR-Dateien und Manifest
Sie möchten eine paketierte Java-Anwendung in `app.jar` mit dem Befehl `java -jar app.jar` ausführen. Welche der folgenden Bedingungen muss erfüllt sein, damit dieser Befehl erfolgreich ausgeführt wird?
- A. Die Klasse, die die `main`-Methode enthält, muss `Main` heißen und sich im Default-Paket befinden.
- B. Die JAR-Datei muss eine `META-INF/MANIFEST.MF`-Datei mit einem `Main-Class`-Attribut enthalten, das den vollqualifizierten Namen der Einstiegspunkt-Klasse angibt.
- C. Das Flag `-cp` oder `-classpath` muss explizit gesetzt werden, um die internen Dateien in der JAR-Datei anzugeben.
- D. Die Einstiegspunkt-Klasse muss von `java.applet.Applet` erben.

**Answer: B**
**Detailed Explanation (German):**
- Beim Ausführen einer JAR-Datei mit `java -jar <jarfile>` ignoriert die JVM das Befehlszeilenargument `-cp` (oder `-classpath`).
- Stattdessen wird der Einstiegspunkt durch den Header `Main-Class` in der Manifest-Datei identifiziert, die sich unter `META-INF/MANIFEST.MF` innerhalb des Archivs befindet. Zum Beispiel: `Main-Class: com.study.Main`.
- Wenn dieser Header fehlt oder falsch ist, bricht die JVM mit dem Fehler `no main manifest attribute, in app.jar` ab.

---

### Frage 16: Variable Argumente (Varargs) und leere CLI-Argumente
Gegeben ist das folgende Programm:
```java
public class VarargsEntry {
    public static void main(String... options) {
        System.out.println(options == null);
        System.out.println(options.length);
    }
}
```
Was wird ausgegeben, wenn dieses Programm mit `java VarargsEntry` (ohne zusätzliche Befehlszeilenparameter) ausgeführt wird?
- A. `true` gefolgt von einer `NullPointerException`
- B. `false` gefolgt von `0`
- C. `true` gefolgt von `0`
- D. Die JVM wirft einen `NoSuchMethodError`, da das Array leer ist.

**Answer: B**
**Detailed Explanation (German):**
- Die JVM initialisiert immer das Array der Parameter, die an die `main`-Methode übergeben werden, selbst wenn keine Befehlszeilenargumente angegeben sind.
- Das Parameter-Array ist niemals `null`. Es wird als leeres Array initialisiert (`new String[0]`).
- Daher wird `options == null` als `false` und `options.length` als `0` ausgewertet. Es wird keine Ausnahme geworfen.

---

### Frage 17: Statische Feldinitialisierung mit Ausnahmen
Was passiert, wenn Sie das folgende Programm kompilieren und auszuführen versuchen?
```java
public class LoadException {
    static int value = 10 / 0; // ArithmeticException
    
    public static void main(String[] args) {
        System.out.println("Value: " + value);
    }
}
```
- A. Der Code kompiliert nicht, da die Division durch Null erkannt wird.
- B. Das Programm kompiliert erfolgreich, wirft jedoch direkt zur Laufzeit eine `ArithmeticException`.
- C. Das Programm kompiliert erfolgreich, wirft jedoch zur Laufzeit einen `java.lang.ExceptionInInitializerError`.
- D. Das Programm kompiliert und gibt `Value: Infinity` aus.

**Answer: C**
**Detailed Explanation (German):**
- **A ist falsch:** Obwohl `10 / 0` zur Laufzeit eine Ausnahme auslöst, ist es syntaktisch gültiger Code und kompiliert ohne Fehler.
- **B ist falsch / C ist korrekt:** Die Division erfolgt während der **Klasseninitialisierungsphase**, wenn statische Initialisierer ausgeführt werden. Wenn eine unbehandelte Laufzeit-Ausnahme innerhalb eines statischen Initialisierungsblocks oder einer statischen Feldinitialisierung geworfen wird, kapselt die JVM diese Ausnahme in einen `java.lang.ExceptionInInitializerError`.
- Wenn Sie den Stacktrace überprüfen, ist die eigentliche Ursache tatsächlich `java.lang.ArithmeticException: / by zero`, aber die vom JVM-Lade-Thread gemeldete äußere Ausnahme ist `ExceptionInInitializerError`.

---

### Frage 18: Positionierung von Systemeigenschaften
Welcher der folgenden Befehle übergibt eine Systemeigenschaft namens `debug` mit dem Wert `true` korrekt an die Anwendung `App`, sodass sie über `System.getProperty("debug")` abgerufen werden kann?
- A. `java App -Ddebug=true`
- B. `java -Ddebug=true App`
- C. `java App debug=true`
- D. `javac -Ddebug=true App.java`

**Answer: B**
**Detailed Explanation (German):**
- Um der JVM eine Systemeigenschaft (System Property) zu übergeben, muss die Syntax `-D<name>=<value>` **vor** dem Klassennamen (dem Einstiegspunkt) in der Befehlszeilen-Argumentreihenfolge stehen.
- **A ist falsch:** Alle Argumente, die *nach* dem Klassennamen angegeben werden, werden als normale Programmargumente behandelt und an das `String[] args`-Array der `main`-Methode übergeben. Die JVM interpretiert sie nicht als Systemeigenschaften.
- **C ist falsch:** Übergibt `"debug=true"` als Programmargument, nicht als Systemeigenschaft.
- **D ist falsch:** `javac` ist der Compiler und führt die Anwendung nicht aus und setzt keine Systemeigenschaften zur Laufzeit.

---

### Frage 19: Strikte Fließkomma-Berechnung (`strictfp`)
Welche der folgenden Aussagen über das Schlüsselwort `strictfp` ist in Java 21 korrekt?
- A. Sie müssen alle Klassen, die double-Werte verwenden, als `strictfp` deklarieren, um sie zu kompilieren.
- B. Das Schlüsselwort `strictfp` wurde vollständig aus der Syntax der Sprache entfernt und führt bei Verwendung zu einem Compilerfehler.
- C. Seit Java 17 sind Fließkomma-Operationen standardmäßig durchgängig strikt, was das Schlüsselwort `strictfp` redundant macht (es wird nun vom Compiler ignoriert).
- D. `strictfp` ist erforderlich, wenn Sie Berechnungen mit virtuellen Threads ausführen möchten.

**Answer: C**
**Detailed Explanation (German):**
- In der Vergangenheit wurde `strictfp` verwendet, um sicherzustellen, dass Fließkommaberechnungen (mit `float` or `double`) auf allen Plattformen die exakt gleichen Ergebnisse lieferten, unabhängig von den Fließkomma-Präzisionsfähigkeiten des zugrundeliegenden Prozessors.
- Seit Java 17 wurden die Fließkomma-Semantiken der JVM so aktualisiert, dass sie standardmäßig strikt sind. Daher ist das Schlüsselwort `strictfp` nun **redundant** und hat keine Wirkung, obwohl es aus Gründen der Abwärtskompatibilität als Schlüsselwort in der Metasprache verbleibt (es verursacht keine Kompilierungsfehler).

---

### Frage 20: Import-Präzedenzregeln
Gegeben ist die folgende Verzeichnis- und Dateistruktur:
`com/study/helper/Logger.class` (definiert eine öffentliche Klasse `Logger` mit einer statischen Methode `log()`).

Und die folgende Quelldatei:
```java
package com.app;

import com.study.helper.*;
import com.study.helper.Logger;

public class Test {
    public static void main(String[] args) {
        Logger.log();
    }
}
```
Welche der folgenden Aussagen ist wahr?
- A. Der Code kompiliert nicht, da der explizite Import von `Logger` mit dem Wildcard-Import `com.study.helper.*` kollidiert.
- B. Der Compiler gibt eine Warnung aus, kompiliert aber erfolgreich.
- C. Der Code kompiliert fehlerfrei, da explizite Importe Vorrang haben und nicht mit Wildcards kollidieren.
- D. Der Code wirft zur Laufzeit einen `LinkageError`.

**Answer: C**
**Detailed Explanation (German):**
- Java erlaubt sowohl Wildcard-Imports als auch explizite Klassen-Imports aus demselben Paket.
- Ein expliziter Import (`import com.study.helper.Logger;`) ist spezifischer als ein Wildcard-Import (`import com.study.helper.*;`), und redundante Imports werden vom Compiler ohne Warnungen oder Fehler sauber aufgelöst.
- Daher kompiliert der Code erfolgreich.
