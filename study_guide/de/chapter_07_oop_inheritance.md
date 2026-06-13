# Kapitel 7: OOP - Vererbung, Überschreiben & Verdecken

## 1. Core Java 21 Prüfungsziele
- Vererbung mittels `extends` anwenden und Interfaces implementieren.
- Regeln zum Überschreiben von Methoden (Method Overriding), kovariante Rückgabetypen und Zugriffseinschränkungen beherrschen.
- Überschreiben (Overriding) von Überladen (Overloading) abgrenzen.
- Virtuelle Methodenaufrufe (Virtual Method Invocation / VMI) verstehen.
- Polymorphe Methodenaufrufe von Variablen-Verdeckung (Field Shadowing) unterscheiden.

---

## 2. Detaillierte Konzepte

### Regeln zum Überschreiben von Methoden (Wichtiger OCP-Prüfungsschwerpunkt)
Eine überschreibende Methode in einer Unterklasse muss fünf strenge Compilerprüfungen bestehen:
1. **Name und Argumente:** Muss exakt dieselbe Signatur (Name und Parameterliste) besitzen.
2. **Zugriffsmodifizierer:** Darf nicht restriktiver (strenger) sein als die Methode der Elternklasse.
   - Ist die Elternmethode `protected`, darf die Kindmethode nur `protected` oder `public` sein (nicht jedoch package-private oder `private`).
3. **Rückgabetyp:** Muss derselbe Typ oder ein **kovarianter Rückgabetyp** sein (eine Unterklasse des Rückgabetyps der Elternklasse).
4. **Geprüfte Exceptions (Checked Exceptions):** Darf keine neuen oder breiteren *geprüften* Exceptions deklarieren. Sie darf dieselben, engere oder beliebige *ungeprüfte* (Runtime) Exceptions deklarieren.
5. **Statisch vs. Instanz:** Eine Instanzmethode kann keine statische Methode überschreiben (führt zu einem Kompilierfehler). Eine statische Methode kann keine Instanzmethode überschreiben.
   - Definiert eine Unterklasse eine statische Methode mit der gleichen Signatur wie eine statische Elternmethode, so wird die Elternmethode **verdeckt (hidden)**, nicht überschrieben.

### Überschreiben (Overriding) vs. Überladen (Overloading)
- **Überschreiben (Overriding):** Dynamische Polymorphie. Erfolgt in Unterklassen. Gleiche Argumente, gleicher Name. Auflösung erfolgt zur **Laufzeit** (Runtime).
- **Überladen (Overloading):** Statische Polymorphie. Erfolgt in derselben Klasse oder Unterklasse. Unterschiedliche Argumente, gleicher Name. Auflösung erfolgt zur **Kompilierzeit** basierend auf den Referenztypen.

### Variablen-Verdeckung / Field Shadowing (Variablen sind NICHT polymorph)
In Java gilt Polymorphie *nur* für Instanzmethoden, nicht für Instanzvariablen (Felder).
- Wenn eine Unterklasse ein Feld mit demselben Namen deklariert wie ein Feld der Elternklasse, so **verdeckt (shadows)** das Unterklassenfeld das der Elternklasse.
- Beim Zugriff auf ein Feld löst die JVM dieses zur **Kompilierzeit** basierend auf dem **deklarierten Referenztyp** auf, nicht auf dem tatsächlichen Laufzeit-Objekttyp.

---

## 3. JVM-Interna & Speicherlayout

### Virtuelle Methodenaufrufe (VMI) & die `vtable`
Wenn die JVM eine Klasse kompiliert, generiert sie eine virtuelle Methodentabelle (**`vtable`**) für jede Klasse.
- Die `vtable` ist ein Array von Speicherzeigern, die auf den Bytecode von virtuellen (überschreibbaren) Methoden zeigen.
- Überschreibt eine Unterklasse eine Elternmethode nicht, zeigt ihr `vtable`-Eintrag auf die Implementierung der Elternklasse.
- Überschreibt die Unterklasse die Elternmethode, wird der `vtable`-Eintrag so aktualisiert, dass er auf den Bytecode der Unterklasse zeigt.
- Zur Laufzeit nutzt die JVM den Bytecode-Befehl `invokevirtual`, der in der `vtable` des tatsächlichen Objekts nachschlägt, um die korrekte Methode aufzurufen.

```
+-----------------------------------------------------------+
| JVM POLYMORPHIE VS VERDECKUNG                             |
|                                                           |
| Deklarierte Referenz: Parent p = new Child();             |
|                                                           |
| 1. Feldzugriff (Kompilierzeit-Auflösung):                 |
|    - p.name ---> Aufgelöst über den Referenztyp Parent    |
|    - Greift auf Parent.name zu                            |
|                                                           |
| 2. Methodenzugriff (Laufzeit-VMI-Nachschlagen):           |
|    - p.show() -> Aufgelöst über tatsächlichen Typ (Child) |
|    - Schlägt in Child-vtable nach -> Ruft Child.show() auf|
+-----------------------------------------------------------+
```

---

## 4. Knifflige OCP-Prüfungsfragen

### Frage 1: Einschränkungen der Zugriffsmodifizierer beim Überschreiben
Betrachten Sie die folgenden Klassen:
```java
class Super {
    protected void process() {}
}

class Sub extends Super {
    // INSERT CODE HERE
}
```
Welche der folgenden Methodendeklarationen können in `Sub` eingefügt werden, damit der Code erfolgreich kompiliert? (Wählen Sie alle zutreffenden Antworten aus)
- A. `public void process() {}`
- B. `protected void process() {}`
- C. `void process() {}`
- D. `private void process() {}`

**Antwort: A, B**
**Ausführliche Erklärung:**
- Gemäß den Java-Regeln zum Überschreiben von Methoden darf eine Methode einer Unterklasse **keine schwächeren (restriktiveren) Zugriffsprivilegien** als die Methode der Elternklasse vergeben.
- Der Zugriffsmodifizierer der Elternmethode ist `protected`.
- Die Hierarchie der Zugriffsmodifizierer von der am leichtesten zugänglichen zur am stärksten eingeschränkten ist:
  `public` $\rightarrow$ `protected` $\rightarrow$ default (package-private) $\rightarrow$ `private`.
- Daher muss die überschreibende Methode in der Unterklasse entweder `protected` oder `public` sein.
- **C (Default-Zugriff) ist falsch:** Es schränkt die Barrierefreiheit von `protected` auf default (package-private) ein.
- **D (`private`) ist falsch:** Es schränkt den Zugriff noch weiter ein.
- **A und B sind korrekt:** Sie behalten die Zugriffsebene bei oder erweitern sie.

---

### Frage 2: Statische Interfacemethoden und Vererbung
Was ist das Ergebnis des Versuchs, den folgenden Code zu kompilieren und auszuführen?
```java
interface Helper {
    static void log() {
        System.out.print("Log ");
    }
}

class Logger implements Helper {}

public class InterfaceStatic {
    public static void main(String[] args) {
        Logger logger = new Logger();
        // Option 1
        Helper.log();
        // Option 2
        // Logger.log();
        // Option 3
        // logger.log();
    }
}
```
Wenn Option 2 und Option 3 auskommentiert sind, wie verhält sich das Programm?
- A. Kompiliert erfolgreich und gibt `Log ` aus.
- B. Kompilierung schlägt fehl, da `Logger` die Methode `log()` überschreiben muss.
- C. Kompilierung schlägt fehl, wenn Option 1 ausgeführt wird, da statische Methoden von Interfaces nicht vererbt werden.
- D. Löst eine Runtime-Exception aus.

**Antwort: A**
**Ausführliche Erklärung:**
- **Statische Interfacemethoden werden NICHT** von implementierenden Klassen oder Subinterfaces vererbt.
- Dies ist ein wesentlicher Unterschied zur statischen Vererbung bei Klassen: Eine statische Klassenmethode *wird* von Unterklassen vererbt, eine statische Interfacemethode jedoch nicht.
- Die einzige Möglichkeit, eine statische Interfacemethode aufzurufen, besteht darin, den **Interfacenamen explizit** zu verwenden (`Helper.log()`).
- Daher:
  - `Helper.log();` (Option 1) kompiliert und läuft erfolgreich.
  - `Logger.log();` (Option 2) kompiliert nicht, da die Klasse `Logger` keine `log()`-Methode erbt oder enthält.
  - `logger.log();` (Option 3) kompiliert nicht, da statische Interfacemethoden nicht auf Instanzen implementierender Klassen aufgerufen werden können.
- Da Option 2 und Option 3 im Code auskommentiert sind, kompiliert der Code fehlerfrei und gibt `Log ` aus.

---

### Frage 3: Überschneidende default-Interfacemethoden
Was passiert, wenn Sie die folgende Klassendefinition kompilieren?
```java
interface Walkable {
    default void move() { System.out.print("Walk "); }
}
interface Runnable {
    default void move() { System.out.print("Run "); }
}
class Athlete implements Walkable, Runnable {
    public void move() {
        Walkable.super.move();
        System.out.print("Athlete ");
    }
}
public class DiamondTest {
    public static void main(String[] args) {
        new Athlete().move();
    }
}
```
- A. Schlägt beim Kompilieren fehl aufgrund kollidierender default-Methodenimplementierungen von `move()`.
- B. Kompiliert erfolgreich und gibt `Walk Athlete ` aus.
- C. Kompiliert erfolgreich und gibt `Run Athlete ` aus.
- D. Kompiliert erfolgreich, führt jedoch zu einer Warnung wegen Mehrdeutigkeit.

**Antwort: B**
**Ausführliche Erklärung:**
- Wenn eine konkrete Klasse mehrere Interfaces implementiert, die default-Methoden mit genau derselben Signatur definieren (eine Kollision im Sinne des Diamond-Problems), wirft der Compiler einen Fehler, es sei denn, die Unterklasse überschreibt die Methode explizit, um den Konflikt zu lösen.
- Hier überschreibt die Klasse `Athlete` die Methode `move()`, was den Kompilierungskonflikt erfolgreich löst.
- Innerhalb der überschriebenen Methode erlaubt Java Entwicklern, mittels der speziellen Syntax `<InterfaceName>.super.<methodName>()` an eine bestimmte Interface-Implementierung zu delegieren.
- Hier delegiert `Walkable.super.move();` die Ausführung an die default-Implementierung von `Walkable`, was `"Walk "` ausgibt.
- Danach gibt der Methodenrumpf `"Athlete "` aus.
- Ausgabe: `Walk Athlete `.

---

### Frage 4: Regel "Class Wins" (Elternklasse vs. default-Interfacemethoden)
Was ist die Ausgabe bei der Ausführung des folgenden Codes?
```java
interface Speaker {
    default void speak() { System.out.print("Speak "); }
}

class Human {
    public void speak() { System.out.print("Hello "); }
}

class Child extends Human implements Speaker {}

public class ClassWins {
    public static void main(String[] args) {
        new Child().speak();
    }
}
```
- A. Kompilierung schlägt fehl aufgrund eines Signaturkonflikts bei `speak()`.
- B. Gibt `Speak ` aus.
- C. Gibt `Hello ` aus.
- D. Gibt `Hello Speak ` aus.

**Antwort: C**
**Ausführliche Erklärung:**
- Java wendet die Regel **"Class Wins"** (Klasse gewinnt) für Konflikte bei der Methodenauflösung zwischen Klassen und Interfaces an.
- Wenn eine Klasse eine Methode von einer Elternklasse erbt und gleichzeitig ein Interface mit einer default-Methode genau derselben Signatur implementiert:
  - Die Implementierung der Elternklasse **hat immer Vorrang** vor der default-Implementierung des Interfaces.
  - Die default-Interfacemethode wird ignoriert.
- In diesem Code erbt `Child` die Methode `speak()` von `Human` und implementiert gleichzeitig `Speaker` (welches die default-Methode `speak()` enthält).
- Nach der "Class Wins"-Regel hat `Human.speak()` Vorrang.
- Ausgabe: `Hello `.

---

### Frage 5: Polymorphe Arrays und ArrayStoreExceptions
Was ist das Ergebnis der Ausführung des folgenden Programms?
```java
class Animal {}
class Dog extends Animal {}
class Cat extends Animal {}

public class ArrayPolymorph {
    public static void main(String[] args) {
        Animal[] array = new Dog[3];
        try {
            array[0] = new Dog();
            array[1] = new Cat();
        } catch (Exception e) {
            System.out.print("Exception ");
        }
    }
}
```
- A. Kompiliert und wird erfolgreich ausgeführt, ohne etwas auszugeben.
- B. Kompilierung schlägt fehl.
- C. Wirft zur Laufzeit eine `ArrayStoreException` (nicht durch `catch(Exception)` abgefangen).
- D. Gibt `Exception ` aus (da die `ArrayStoreException` abgefangen wird).

**Antwort: D**
**Ausführliche Erklärung:**
- **Kompilierung:** `Animal[] array = new Dog[3];` ist syntaktisch gültig, da `Dog[]` zu `Animal[]` zugewiesen werden kann (Kovarianz von Arrays in Java). Der Compiler prüft beim Zuweisen von Elementen an das Array lediglich, ob `Dog` und `Cat` Unterklassen von `Animal` sind, was der Fall ist. Somit kompiliert der Code erfolgreich.
- **Laufzeit:** Das tatsächliche auf dem Heap zugewiesene Array ist vom Typ `Dog[]`. Zur Laufzeit erzwingt die JVM Typsicherheit.
  - `array[0] = new Dog();` ist erfolgreich, da das Objekt dem Array-Typ `Dog[]` entspricht.
  - `array[1] = new Cat();` versucht, ein `Cat`-Objekt in einem `Dog[]`-Array zu speichern. Die JVM erkennt diese Verletzung und wirft eine **`java.lang.ArrayStoreException`**.
- Da `ArrayStoreException` eine Unterklasse von `RuntimeException` ist (die von `Exception` erbt), fängt der Block `catch (Exception e)` die Exception ab und gibt `"Exception "` aus.
- Ausgabe: `Exception `.

---

### Frage 6: Verdecken von Methoden vs. Exceptions beim Überschreiben
Was ist das Kompilierungsergebnis des folgenden Codes?
```java
import java.io.IOException;

class Parent {
    public static void print() throws IOException {
        System.out.println("Parent");
    }
}

class Child extends Parent {
    public static void print() {
        System.out.println("Child");
    }
}
```
- A. Schlägt beim Kompilieren fehl, da statische Methoden keine Exceptions deklarieren dürfen.
- B. Schlägt beim Kompilieren fehl, da `print()` in der Unterklasse keine `IOException` deklariert.
- C. Kompiliert erfolgreich, da statische Methoden verdeckt und nicht überschrieben werden, was bedeutet, dass die Standard-Exception-Einschränkungen für das Überschreiben nicht gelten.
- D. Schlägt beim Kompilieren fehl, da `print()` eine Instanzmethode sein muss.

**Antwort: C**
**Ausführliche Erklärung:**
- Die Methoden in diesem Code sind `static`.
- In Java werden statische Methoden **verdeckt (hidden), nicht überschrieben (overridden)**.
- Entscheidend ist, dass die strengen Prüfungen des Compilers für das Überschreiben von Methoden (wie Zugriffsmodifizierer, Rückgabetypen und Einschränkungen für geprüfte Exceptions) beim Verdecken von statischen Methoden **nicht** gelten.
- Die Unterklasse kann eine statische Elternmethode mit einer völlig anderen Exception-Signatur verdecken (oder überhaupt keine Exceptions deklarieren).
- Daher kompiliert die Klasse erfolgreich.

---

### Frage 7: Zugriff auf Interface-Felder und Mehrdeutigkeit
Betrachten Sie die folgenden Interfaces und die folgende Klasse:
```java
interface Alpha {
    int SPEED = 50;
}
interface Beta {
    int SPEED = 100;
}
class Vehicle implements Alpha, Beta {
    public void printSpeed() {
        // Line 8
    }
}
```
Welche Anweisung kompiliert erfolgreich, wenn sie in Zeile 8 eingefügt wird?
- A. `System.out.println(SPEED);`
- B. `System.out.println(Alpha.SPEED);`
- C. `System.out.println(super.SPEED);`
- D. `SPEED = 75;`

**Antwort: B**
**Ausführliche Erklärung:**
- In Interfaces deklarierte Felder sind implizit **`public static final`**.
- **A kompiliert nicht:** Da sowohl `Alpha` als auch `Beta` eine Konstante namens `SPEED` definieren, führt die direkte Referenzierung von `SPEED` in `Vehicle` zu einem Kompilierfehler: `reference to SPEED is ambiguous` (Mehrdeutigkeit).
- **B kompiliert:** Auf die Konstante wird sauber zugegriffen, indem der Interfacename vorangestellt wird (`Alpha.SPEED`).
- **C kompiliert nicht:** `super` bezieht sich auf die Elternklasse (`java.lang.Object`), die `SPEED` nicht enthält. Sie können `super` auf diese Weise nicht verwenden, um auf Interface-Member zuzugreifen.
- **D kompiliert nicht:** Interface-Variablen sind implizit `final` und können nicht neu zugewiesen werden.

---

### Frage 8: Compiler-Prüfungen beim Casting (Klasse vs. Interface Casting)
Gegeben sei die folgende Klassenstruktur:
```java
interface Singer {}
class Athlete {}
class Runner extends Athlete {}

public class CastTest {
    public static void main(String[] args) {
        Athlete a = new Runner();
        
        // Line 8
        Singer s1 = (Singer) a; 
        
        // Line 11
        Runner r1 = (Runner) a; 
    }
}
```
Welche der folgenden Aussagen beschreibt das Kompilierungsergebnis der Casting-Anweisungen?
- A. Sowohl Zeile 8 als auch Zeile 11 kompilieren erfolgreich.
- B. Zeile 8 schlägt beim Kompilieren fehl, aber Zeile 11 kompiliert erfolgreich.
- C. Zeile 11 schlägt beim Kompilieren fehl, aber Zeile 8 kompiliert erfolgreich.
- D. Beide Casting-Zeilen schlagen beim Kompilieren fehl.

**Antwort: A**
**Ausführliche Erklärung:**
- **Zeile 11 (kompiliert):** `a` hat den deklarierten Typ `Athlete`, und `Runner` ist eine Unterklasse von `Athlete`. Dies ist ein Downcast, der syntaktisch gültig ist (und zur Laufzeit überprüft wird).
- **Zeile 8 (kompiliert):** `a` hat den deklarierten Typ `Athlete` (eine Klasse), und wir casten es auf `Singer` (ein Interface).
- In Java **erlaubt der Compiler das Casten jeder nicht-finalen Klassenreferenz auf einen beliebigen Interface-Typ**, selbst wenn die Klasse das Interface nicht implementiert. Der Compiler geht davon aus, dass eine Unterklasse von `Athlete` zur Laufzeit `Singer` implementieren könnte.
- Da `Athlete` keine `final`-Klasse ist, kompiliert dieser Cast ohne Fehler (obwohl er zur Laufzeit eine `ClassCastException` wirft, da `Runner` `Singer` in Wirklichkeit nicht implementiert).
- *(Hinweis: Wäre `Athlete` als `final` deklariert, z. B. `final class Athlete {}`, würde der Compiler Zeile 8 ablehnen, da es niemals eine Unterklasse von `Athlete` geben könnte, die `Singer` implementiert)*.

---

### Frage 9: Überschreiben von privaten Methoden
Was ist das Kompilierungsergebnis des folgenden Codes?
```java
class Parent {
    private void show() {
        System.out.println("Parent");
    }
}

class Child extends Parent {
    @Override
    public void show() {
        System.out.println("Child");
    }
}
```
- A. Kompiliert erfolgreich.
- B. Schlägt beim Kompilieren fehl, da `Child.show()` den Zugriff auf eine private Methode nicht erweitern kann.
- C. Schlägt beim Kompilieren fehl, da `@Override` ungültig ist (private Methoden können nicht überschrieben werden).
- D. Schlägt beim Kompilieren fehl, da private Methoden in der Elternklasse abstrakt sein müssen.

**Antwort: C**
**Ausführliche Erklärung:**
- Unterklassen erben keine `private`-Methoden von Elternklassen.
- Da `Parent.show()` privat ist, ist es für `Child` völlig unsichtbar.
- Daher kann `Child` diese Methode nicht überschreiben. Die Methode `show()` in `Child` wird als eine völlig neue Methodendeklaration behandelt.
- Da `show()` in `Child` keine erreichbare Methode aus der Elternklasse überschreibt, führt die Verwendung der `@Override`-Annotation zu einem Kompilierfehler: `method does not override or implement a method from a supertype`.
- Wenn `@Override` entfernt würde, würde der Code erfolgreich kompilieren.

---

### Frage 10: Private Methoden in Interfaces (Java 9+)
Welche der folgenden Aussagen über `private`-Methoden in Java-Interfaces ist korrekt? (Wählen Sie alle zutreffenden Antworten aus)
- A. Sie können nicht statisch sein.
- B. Eine private statische Interfacemethode kann sowohl von default- als auch von statischen Methoden im selben Interface aufgerufen werden.
- C. Eine private nicht-statische Interfacemethode kann von default-Methoden, jedoch nicht von statischen Methoden im selben Interface aufgerufen werden.
- D. Private Interfacemethoden müssen einen Implementierungsrumpf enthalten.
- E. Sie werden von Klassen vererbt, die das Interface implementieren.

**Antwort: B, C, D**
**Ausführliche Erklärung:**
- **A ist falsch:** Private statische Interfacemethoden sind zulässig.
- **B ist korrekt:** Statische Member können sowohl aus statischen als auch aus nicht-statischen Kontexten aufgerufen werden.
- **C ist korrekt:** Nicht-statische private Methoden können nicht aus einer statischen Interfacemethode aufgerufen werden, da statische Methoden keinen Instanzkontext besitzen.
- **D ist korrekt:** Alle privaten Methoden (wie statische und default-Methoden) müssen einen Rumpf `{ ... }` bereitstellen. Sie können nicht abstrakt sein.
- **E ist falsch:** Private Member sind privat für das Interface und werden niemals vererbt oder sind für implementierende Klassen sichtbar.

---

### Frage 11: Interface-Vererbung mit Überschreiben von default-Methoden
Betrachten Sie die Interfaces:
```java
interface Base {
    default void print() { System.out.print("Base "); }
}
interface Intermediate extends Base {
    void print(); // redeclared abstract
}
class Concrete implements Intermediate {
    public void print() {
        System.out.print("Concrete");
    }
}
```
Wenn Sie `new Concrete().print();` ausführen, was ist die Ausgabe?
- A. `Base Concrete`
- B. `Concrete`
- C. Schlägt beim Kompilieren fehl, da `Intermediate` default-Methoden nicht als abstrakt deklarieren kann.
- D. Schlägt beim Kompilieren fehl, da `Concrete` eine default-Implementierung fehlt.

**Antwort: B**
**Ausführliche Erklärung:**
- Ein Interface (`Intermediate`) kann ein anderes Interface (`Base`) erweitern und eine default-Methode als **abstrakt** redeklarieren.
- Dies entzieht ihr effektiv die default-Implementierung und zwingt jede konkrete Klasse, die `Intermediate` implementiert, eine explizite Implementierung von `print()` bereitzustellen.
- Die Klasse `Concrete` implementiert `Intermediate` und überschreibt `print()`, was `"Concrete"` ausgibt.
- Ausgabe: `Concrete`.

---

### Frage 12: Final-Methoden und das Verdecken von Methoden
Was ist das Ergebnis des Kompilierens der folgenden Klassenhierarchie?
```java
class Parent {
    public final static void log() {}
}
class Child extends Parent {
    public static void log() {}
}
```
- A. Kompiliert erfolgreich, da statische Methoden verdeckt und nicht überschrieben werden.
- B. Schlägt beim Kompilieren fehl, da `final`-Methoden weder überschrieben noch verdeckt werden können.
- C. Schlägt beim Kompilieren fehl, da statische Methoden nicht als final deklariert werden können.
- D. Kompiliert, warnt jedoch vor Konflikten beim Überschreiben von Methoden.

**Antwort: B**
**Ausführliche Erklärung:**
- Obwohl statische Methoden verdeckt und nicht überschrieben werden, **verhindert das Schlüsselwort `final` dennoch das Verdecken in der Unterklasse**.
- Wenn eine Superklasse eine statische Methode als `final` deklariert (`public final static void log()`), ist es Unterklassen untersagt, eine statische Methode mit derselben Signatur zu definieren.
- Der Versuch, dies zu tun, führt zu einem Kompilierfehler: `log() in Child cannot override/hide log() in Parent; overridden/hidden method is final`.

---

### Frage 13: Konkrete Unterklasse implementiert abstrakte Klasse
Was ist das Kompilierungsergebnis des folgenden Codes?
```java
interface Action {
    void run();
}
abstract class Worker implements Action {}

class ConcreteWorker extends Worker {
    // empty
}
```
- A. Kompiliert erfolgreich.
- B. Schlägt beim Kompilieren fehl, da `Worker` die Methode `run()` von `Action` implementieren muss.
- C. Schlägt beim Kompilieren fehl, da `ConcreteWorker` die Methode `run()` von `Action` implementieren muss.
- D. Schlägt beim Kompilieren fehl, da `Worker` ein Interface nicht implementieren kann, ohne alle Methoden zu überschreiben.

**Antwort: C**
**Ausführliche Erklärung:**
- **Abstrakte Klassen** (`Worker`) müssen die abstrakten Methoden der von ihnen implementierten Interfaces nicht selbst implementieren. Sie können die Implementierung an ihre Unterklassen delegieren.
- Die **erste konkrete Unterklasse** (`ConcreteWorker`), die `Worker` erweitert, muss jedoch alle geerbten abstrakten Methoden implementieren.
- Da `ConcreteWorker` konkret ist und `run()` nicht implementiert, schlägt die Kompilierung mit dem Fehler fehl: `ConcreteWorker is not abstract and does not override abstract method run() in Action`.

---

### Frage 14: Überladen mit inkompatiblen Rückgabetypen
Gegeben sei die Klasse:
```java
public class OverloadTest {
    public void print(int x) {}
    public int print(int x) { return x; }
}
```
Kompiliert dies?
- A. Ja, da das Überladen unterschiedliche Rückgabetypen erlaubt.
- B. Nein, da der Rückgabetyp allein nicht ausreicht, um überladene Methoden zu unterscheiden.
- C. Ja, wenn der Zugriffsmodifizierer der zweiten Methode in private geändert wird.
- D. Nein, da die Parameterlisten identisch sind.

**Antwort: D**
**Ausführliche Erklärung:**
- Um eine Methode zu überladen, **müssen die Parameterlisten unterschiedlich sein** (unterschiedliche Anzahl von Argumenten, unterschiedliche Typen oder eine andere Reihenfolge der Typen).
- Das Ändern des Rückgabetyps oder des Zugriffsmodifizierers ist **nicht ausreichend**, um eine Methode zu überladen.
- Da beide Methoden die Signatur `print(int)` besitzen, werden sie vom Compiler als Duplikate betrachtet, und die Kompilierung schlägt fehl.

---

### Frage 15: Abstrakte Methoden überschreiben konkrete Methoden
Ist es zulässig, dass eine abstrakte Methode in einer abstrakten Klasse eine konkrete Methode in einer Superklasse überschreibt?
```java
class NormalClass {
    public void execute() { System.out.println("Normal"); }
}
abstract class AbstractSub extends NormalClass {
    public abstract void execute();
}
```
- A. Nein, eine abstrakte Methode kann keine konkrete Methode überschreiben.
- B. Ja, dies ist zulässig und zwingt konkrete Unterklassen von `AbstractSub`, die Methode zu überschreiben.
- C. Schlägt beim Kompilieren fehl, da `AbstractSub` `super.execute()` aufrufen muss.
- D. Ja, aber es führt zu einer Warnung zur Laufzeit.

**Antwort: B**
**Ausführliche Erklärung:**
- In Java ist es absolut zulässig, dass eine abstrakte Klasse (`AbstractSub`) eine konkrete Methode (`execute()`) überschreibt und als `abstract` deklariert.
- Diese Design-Entscheidung zwingt alle konkreten Unterklassen von `AbstractSub`, eine neue Implementierung von `execute()` bereitzustellen, wodurch das in `NormalClass` definierte konkrete Standardverhalten ignoriert wird.
- Der Code kompiliert fehlerfrei.

---

### Frage 16: Variablenzugriff über Typ-Casting
Was ist die Ausgabe bei der Ausführung des folgenden Programms?
```java
class Parent {
    int val = 10;
}
class Child extends Parent {
    int val = 20;
}
public class CastField {
    public static void main(String[] args) {
        Child c = new Child();
        System.out.println(c.val + " " + ((Parent) c).val);
    }
}
```
- A. `20 20`
- B. `10 20`
- C. `20 10`
- D. Schlägt beim Kompilieren fehl.

**Antwort: C**
**Ausführliche Erklärung:**
- Das Casten einer Referenz (z. B. `(Parent) c`) ändert den **Referenztyp zur Kompilierzeit** der Variable.
- Da Felder zur Kompilierzeit basierend auf dem deklarierten Typ der Referenz aufgelöst werden, greift `c.val` auf die Variable in `Child` zu (Wert `20`), während `((Parent) c).val` auf die Variable in `Parent` zugreift (Wert `10`).
- Daher ist die Ausgabe `20 10`.

---

### Frage 17: Modifizierer für abstrakte Interfacemethoden
Welche der folgenden Modifizierer werden implizit auf alle abstrakten Interfacemethoden in Java angewendet? (Wählen Sie alle zutreffenden Antworten aus)
- A. `public`
- B. `abstract`
- C. `static`
- D. `final`
- E. `protected`

**Antwort: A, B**
**Ausführliche Erklärung:**
- Alle in einem Interface deklarierten abstrakten Methoden sind implizit **`public`** und **`abstract`**.
- Sie als `public abstract void method();` zu deklarieren ist zulässig, gilt jedoch als redundant.
- Interfacemethoden können nicht `protected` oder package-private (default) sein.
- Sie können nicht `final` sein, da abstrakte Methoden von Unterklassen implementiert werden müssen und `final` die Implementierung verhindert. Sie können nicht `static` sein, es sei denn, sie besitzen einen Methodenrumpf.

---

### Frage 18: Regeln zur Interface-Erweiterung
Welche der folgenden Aussagen über Interfaces, die andere Interfaces erweitern, ist korrekt?
- A. Ein Interface implementiert andere Interfaces mithilfe des Schlüsselworts `implements`.
- B. Ein Interface kann mehrere Interfaces mithilfe des Schlüsselworts `extends` erweitern.
- C. Ein Interface kann nur ein einziges Interface erweitern.
- D. Interfaces können keine anderen Interfaces erweitern.

**Antwort: B**
**Ausführliche Erklärung:**
- Interfaces implementieren keine anderen Interfaces (sie können keine konkreten Implementierungen abstrakter Methoden enthalten).
- Stattdessen **erweitern** Interfaces andere Interfaces mithilfe des Schlüsselworts **`extends`**.
- Im Gegensatz zu Klassen (die nur die einfache Vererbung unterstützen) **kann ein Interface mehrere Interfaces erweitern** (z. B. ist `interface C extends A, B {}` absolut zulässig).
- Daher ist B korrekt.

---

### Frage 19: Kompatibilität von kovarianten Rückgabetypen bei Primitiven
Können kovariante Rückgabetypen beim Überschreiben von Methoden auf primitive Rückgabetypen angewendet werden?
```java
class Parent {
    public long getNumber() { return 1L; }
}
class Child extends Parent {
    public int getNumber() { return 1; }
}
```
- A. Ja, da `int` mit `long` kompatibel ist.
- B. Nein, kovariante Rückgabetypen sind streng auf Objektreferenzen beschränkt.
- C. Ja, aber nur, wenn beide Werte explizit gecastet werden.
- D. Ja, da `int` zu `long` befördert (promoted) werden kann.

**Antwort: B**
**Ausführliche Erklärung:**
- Kovariante Rückgabetypen **gelten nur für Referenztypen** (Objekte).
- Bei primitiven Rückgabetypen **muss** die überschreibende Methode **exakt denselben Rückgabetyp** haben wie die überschriebene Methode.
- Obwohl `int` im numerischen Wertebereich eine Untermenge von `long` darstellt, unterstützen primitive Typen in Java keine kovarianten Überschreibungen.
- Daher schlägt die Kompilierung von `Child` fehl, da der Rückgabetyp `int` beim Überschreiben nicht kompatibel mit `long` ist.

---

### Frage 20: Überschreiben mit Exceptions in der Vererbungshierarchie
Gegeben seien die Klassen:
```java
import java.io.*;

class Parent {
    public void print() throws IOException {}
}
class Child extends Parent {
    public void print() throws FileNotFoundException {}
}
```
Warum kompiliert dieser Code erfolgreich?
- A. Weil `FileNotFoundException` eine Unterklasse von `IOException` ist.
- B. Weil `Child.print()` eine allgemeinere (breitere) Exception wirft.
- C. Weil Exception-Deklarationen beim Kompilieren ignoriert werden.
- D. Weil `FileNotFoundException` eine ungeprüfte (unchecked) Exception ist.

**Antwort: A**
**Ausführliche Erklärung:**
- Überschreibende Methoden können **spezifischere (engere) geprüfte Exceptions** deklarieren als die Elternmethode.
- `FileNotFoundException` ist eine Unterklasse von `IOException`.
- Da sie spezifischer ist, entspricht die überschreibende Methode in `Child` den Richtlinien für das Überschreiben von Methoden mit Exceptions, und der Code kompiliert erfolgreich.


