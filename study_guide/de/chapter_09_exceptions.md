# Kapitel 9: Ausnahmebehandlung & try-with-resources

## 1. Core Java 21 Prüfungsziele
- Die `Throwable`-Hierarchie beherrschen und zwischen geprüften Exceptions (Checked Exceptions), ungeprüften Exceptions (Unchecked/Runtime Exceptions) sowie JVM-Fehlern (Errors) unterscheiden.
- Robuste Fehlerbehandlung mittels `try-catch-finally` und Multi-Catch-Blöcken schreiben.
- Ressourcenmanagement mit **try-with-resources** (TWR) implementieren und das `AutoCloseable`-Interface verstehen.
- Die Reihenfolge beim Schließen von Ressourcen und die Verwaltung von **unterdrückten Exceptions (Suppressed Exceptions)** verstehen.
- Zusicherungen (Assertions via `assert`) anwenden und deren Ausführung zur Laufzeit konfigurieren.

---

## 2. Detaillierte Konzepte

### Klassifizierung von Ausnahmen (Exceptions)
- **`Error`:** Schwere Probleme innerhalb der JVM (z. B. `OutOfMemoryError`, `StackOverflowError`). Anwendungen sollten diese nicht abfangen. Sie sind ungeprüft (unchecked).
- **`RuntimeException` (ungeprüft / unchecked):** Logische Programmierfehler (z. B. `NullPointerException`, `ArrayIndexOutOfBoundsException`). Sie erfordern keine explizite Behandlung.
- **`Exception` (geprüft / checked):** Externe bzw. umgebungsbedingte Fehler (z. B. `IOException`, `SQLException`). Der Compiler zwingt Sie, diese entweder über einen `try-catch`-Block zu behandeln oder in der Methodensignatur (`throws`) zu deklarieren.

### Regeln für Try-With-Resources (TWR)
TWR wurde mit Java 7 eingeführt, um das manuelle Aufräumen von Ressourcen in `finally`-Blöcken zu ersetzen und garantiert das sichere Schließen von Ressourcen.
1. **Der `AutoCloseable`-Vertrag:** Jede in den runden Klammern des `try(...)`-Headers initialisierte Klasse muss das Interface `java.lang.AutoCloseable` implementieren (welches eine einzige Methode `close()` definiert, die `Exception` wirft).
2. **Reihenfolge des Schließens:** In TWR deklarierte Ressourcen werden in **umgekehrter Reihenfolge ihrer Deklaration** geschlossen.
3. **Implizites Final:** In TWR deklarierte Variablen sind implizit `final` und können innerhalb des try-Blocks nicht neu zugewiesen werden.

```
TWR-Deklaration:
try (Resource A = new Resource(); Resource B = new Resource()) {
    // Ausführungsfluss
}
Ablauf des Schließens:
[Ende des Try-Blocks] ---> Schließe Resource B ---> Schließe Resource A
```

---

## 3. JVM-Interna & Speicherlayout

### Maskieren von Ausnahmen (Exception Masking) in `finally`-Blöcken
Wenn ein `try`-Block eine Exception wirft und der zugehörige `finally`-Block *ebenfalls* eine Exception wirft, wird die ursprüngliche Exception aus dem `try`-Block **maskiert** (komplett verworfen) und geht verloren. Die JVM gibt in diesem Fall nur die aus dem `finally`-Block geworfene Exception weiter.

### Unterdrückte Exceptions (Suppressed Exceptions) in TWR
TWR verhindert das Maskieren von Ausnahmen.
- Wenn der `try`-Block eine Exception wirft (z. B. `IOException`) und während des automatischen Schließens der Ressourcen die Methode `close()` ebenfalls eine Exception wirft (z. B. `CloseException`), wird die ursprüngliche Exception (die primäre Exception) **weitergegeben**.
- Die Exception aus der `close()`-Methode geht jedoch nicht verloren; sie wird der **Liste der unterdrückten Exceptions (Suppressed Exceptions)** der primären Exception hinzugefügt.
- Sie können auf diese unterdrückten Exceptions mittels `primaryException.getSuppressed()` zugreifen.

```
+--------------------------------------------------------------+
| TWR EXCEPTION-BEHANDLUNG LEBENSZYKLUS                        |
|                                                              |
| 1. Try-Block wirft: IOException (Primär)                     |
| 2. JVM ruft Resource.close() auf                             |
| 3. close() wirft: CloseException                             |
| 4. JVM fängt CloseException und fügt sie hinzu:              |
|    IOException.addSuppressed(CloseException)                 |
| 5. IOException wird im Call-Stack weitergegeben              |
+--------------------------------------------------------------+
```

---

## 4. Tricky OCP Exam Questions

### Frage 1: Reihenfolge des Schließens bei Try-With-Resources und Abfangen von Exceptions
Was ist die Ausgabe bei der Ausführung des folgenden Programms?
```java
class Resource implements AutoCloseable {
    private String name;
    public Resource(String name) { this.name = name; }
    public void close() {
        System.out.print("Close" + name + " ");
    }
}

public class TWRFlow {
    public static void main(String[] args) {
        try (Resource r1 = new Resource("A"); Resource r2 = new Resource("B")) {
            System.out.print("Try ");
            throw new RuntimeException("Error");
        } catch (Exception e) {
            System.out.print("Catch ");
        } finally {
            System.out.print("Finally");
        }
    }
}
```
- A. `Try Catch CloseB CloseA Finally`
- B. `Try CloseB CloseA Catch Finally`
- C. `Try CloseA CloseB Catch Finally`
- D. `Try Catch Finally CloseB CloseA`

**Answer: B**
**Detailed Explanation:**
- In einer Try-With-Resources-Anweisung werden im Header deklarierte Ressourcen automatisch geschlossen, **bevor** die Kontrolle an passende `catch`- oder `finally`-Blöcke derselben Try-Anweisung übergeben wird.
- **Schritt 1:** Der Rumpf des `try`-Blocks wird ausgeführt und gibt `"Try "` aus.
- **Schritt 2:** Eine `RuntimeException` wird innerhalb des Try-Blocks geworfen.
- **Schritt 3:** Bevor nach einem Catch-Block gesucht wird, schließt die JVM automatisch die initialisierten Ressourcen in der **umgekehrten Reihenfolge ihrer Deklaration**:
  - `r2` ("B") wird zuerst geschlossen, was `"CloseB "` ausgibt.
  - `r1` ("A") wird als Zweites geschlossen, was `"CloseA "` ausgibt.
- **Schritt 4:** Die JVM verarbeitet nun die geworfene Exception. Der `catch (Exception e)`-Block passt, wird ausgeführt und gibt `"Catch "` aus.
- **Schritt 5:** Der `finally`-Block wird ausgeführt und gibt `"Finally"` aus.
- Gesamte Ausgabe: `Try CloseB CloseA Catch Finally`.

---

### Frage 2: Einschränkungen bei Multi-Catch-Blöcken
Welche der folgenden `catch`-Block-Deklarationen führen zu einem Compilerfehler? (Wählen Sie alle zutreffenden Antworten aus)
- A. `catch (IOException | SQLException e)`
- B. `catch (FileNotFoundException | IOException e)`
- C. `catch (ArithmeticException | NullPointerException e)`
- D. `catch (Exception | RuntimeException e)`

**Answer: B, D**
**Detailed Explanation:**
- In einem Multi-Catch-Block (`catch (TypeA | TypeB e)`) dürfen die deklarierten Exceptions **keine Eltern-Kind-Vererbungsbeziehung aufweisen**.
- Wenn zwei Exceptions zur selben Vererbungshierarchie gehören:
  - Ist das Abfangen in einem Multi-Catch redundant, da der übergeordnete Exception-Typ bereits die Unterklassen-Exception abfangen würde. Der Compiler markiert dies als Compilerfehler.
- **B lässt sich nicht kompilieren:** `FileNotFoundException` ist eine Unterklasse von `IOException`.
- **D lässt sich nicht kompilieren:** `RuntimeException` ist eine Unterklasse von `Exception`.
- **A lässt sich kompilieren:** `IOException` und `SQLException` sind unabhängige Unterklassen von `Exception`.
- **C lässt sich kompilieren:** `ArithmeticException` und `NullPointerException` sind unabhängige Unterklassen von `RuntimeException`.

---

### Frage 3: Auswertung von Rückgabewerten innerhalb eines finally-Blocks
Was ist der Rückgabewert von `test()`, wenn das folgende Programm ausgeführt wird?
```java
public class ReturnFlow {
    public static int test() {
        int x = 10;
        try {
            return x;
        } finally {
            x = 20;
        }
    }
    public static void main(String[] args) {
        System.out.println(test());
    }
}
```
- A. `10`
- B. `20`
- C. Lässt sich nicht kompilieren, da `x` nach dem Return modifiziert wird.
- D. Wirft zur Laufzeit eine `NullPointerException`.

**Answer: A**
**Detailed Explanation:**
- Wenn ein `return`-Statement in einem `try`-Block angetroffen wird:
  - Wird der Return-Ausdruck (`x`, welcher `10` ist) ausgewertet.
  - Wird der ausgewertete Wert (`10`) in einer temporären lokalen Variable gespeichert (kopiert für die Rückgabe).
  - Wechselt die Kontrolle zum `finally`-Block, bevor die Methode tatsächlich zurückkehrt.
- Innerhalb des `finally`-Blocks ändert `x = 20;` die lokale Variable `x` auf `20`.
- Dies ändert jedoch **nicht** den bereits kopierten Rückgabewert von `10`.
- Daher schließt die Methode ab und gibt `10` zurück.
- *(Hinweis: Wenn der Rückgabetyp ein veränderbares Objekt (mutable object) wäre und der finally-Block die internen Eigenschaften des Objekts ändern würde, wäre die Änderung sichtbar. Wenn der finally-Block ein neues return-Statement ausführen würde, z. B. `return 30;`, würde dies den vorherigen Rückgabewert überschreiben).*

---

### Frage 4: Maskieren von Exceptions im finally-Block
Was ist die Ausgabe bei der Ausführung des folgenden Programms?
```java
public class MaskFlow {
    public static void main(String[] args) {
        try {
            try {
                throw new ArithmeticException("A");
            } finally {
                throw new NullPointerException("B");
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }
}
```
- A. `A`
- B. `B`
- C. `A` gefolgt von `B`
- D. `B` mit `A` als unterdrückte Exception.

**Answer: B**
**Detailed Explanation:**
- Wenn ein Codeblock eine Exception wirft und der zugehörige `finally`-Block **ebenfalls eine Exception wirft**, wird die ursprüngliche Exception aus dem `try`-Block **maskiert (verworfen)**.
- Die JVM kann nur eine einzige Exception aus einem Block weitergeben. Da der `finally`-Block als letztes ausgeführt wird, hat seine Exception Vorrang und wird weitergegeben, während die `ArithmeticException` verloren geht.
- Der äußere `catch (Exception e)`-Block fängt die Exception ab, die vom inneren Try-Finally-Block weitergegeben wurde, was die `NullPointerException` mit der Nachricht `"B"` ist.
- Ausgabe: `B`.

---

### Frage 5: Abrufen von unterdrückten Exceptions bei TWR
Gegeben sind die Ressource und der Ausführungscode:
```java
class CustomRes implements AutoCloseable {
    public void close() throws Exception {
        throw new Exception("CloseError");
    }
}

public class SuppressedTest {
    public static void main(String[] args) {
        try (CustomRes r = new CustomRes()) {
            throw new Exception("TryError");
        } catch (Exception e) {
            System.out.print(e.getMessage() + " " + e.getSuppressed().length);
        }
    }
}
```
- A. `CloseError 1`
- B. `TryError 1`
- C. `TryError 0`
- D. `CloseError 0`

**Answer: B**
**Detailed Explanation:**
- Wenn eine Exception in einem Try-With-Resources-Block geworfen wird, wird sie als die **primäre Exception** behandelt.
- Wenn die Methode `close()` während des automatischen Aufräumens der Ressourcen eine weitere Exception wirft, fängt die JVM diese Close-Exception ab und fügt sie über `addSuppressed()` der **Liste der unterdrückten Exceptions (Suppressed List)** der primären Exception hinzu.
- Daher wird die primäre Exception (`TryError`) weitergegeben und vom `catch (Exception e)`-Block abgefangen.
- Die Nachricht von `e` ist `"TryError"`.
- Die Liste der unterdrückten Exceptions enthält die `CloseError`-Exception, weshalb `e.getSuppressed().length` zu `1` ausgewertet wird.
- Ausgabe: `TryError 1`.

---

### Frage 6: Compilerfehler durch redundanten Catch-Block für checked Exception
Welcher der folgenden Codeblöcke lässt sich nicht kompilieren?
- A. `try {} catch (Exception e) {}`
- B. `try {} catch (RuntimeException e) {}`
- C. `try {} catch (java.io.IOException e) {}`
- D. `try { throw new java.io.IOException(); } catch (java.io.IOException e) {}`

**Answer: C**
**Detailed Explanation:**
- In Java prüft der Compiler auf nicht erreichbare `catch`-Blöcke.
- Wenn ein `try`-Block **keinen** Code enthält, der eine bestimmte **geprüfte Exception (Checked Exception)** (wie `IOException`) werfen kann, ist das Deklarieren eines `catch`-Blocks für diese geprüfte Exception ein **Compilerfehler**. Der Compiler erkennt, dass es sich um toten Code handelt.
- **C lässt sich nicht kompilieren**, da der Try-Block leer ist und niemals eine `IOException` werfen kann.
- **A und B lassen sich kompilieren:** Der Compiler erlaubt das Abfangen von `Exception`, `Throwable` und allen ungeprüften Exceptions (wie Unterklassen von `RuntimeException`) in jedem Try-Block, selbst wenn dieser leer ist.
- **D lässt sich kompilieren:** Der Try-Block wirft explizit eine `IOException`.

---

### Frage 7: Try-with-Resources und Effectively Final Variablen (Java 9+)
Betrachten Sie die folgenden TWR-Strukturen:
```java
// Option I
Resource r = new Resource();
try (r) { }

// Option II
final Resource r = new Resource();
try (r) { }

// Option III
Resource r = new Resource();
try (r) {
    r = new Resource(); // Line 10
}
```
Unter der Annahme, dass `Resource` das Interface `AutoCloseable` implementiert, welche der Optionen führt zu einem Compilerfehler?
- A. Nur Option I
- B. Nur Option III
- C. Nur Option I und III
- D. Alle Optionen lassen sich erfolgreich kompilieren.

**Answer: B**
**Detailed Explanation:**
- Seit Java 9 können Sie eine bereits existierende Variable im Try-With-Resources-Header referenzieren (z. B. `try (r)`), ohne sie neu zu deklarieren, vorausgesetzt, die Variable ist **final** oder **effectively final** (wird nach der Initialisierung nie neu zugewiesen).
- **Option I lässt sich kompilieren:** `r` wird nie neu zugewiesen, ist also effectively final.
- **Option II lässt sich kompilieren:** `r` ist explizit als `final` deklariert.
- **Option III lässt sich nicht kompilieren:** Innerhalb des `try`-Blocks weist die Anweisung `r = new Resource();` der Variable `r` einen neuen Wert zu. Dies verletzt die Anforderung, dass TWR-Variablen effectively final sein müssen. Der Compiler bemängelt diese Neuzuweisung.

---

### Frage 8: Verhalten beim Werfen einer Null-Referenz
Was ist das Ergebnis der Ausführung der folgenden Anweisung?
```java
throw null;
```
- A. Lässt sich nicht kompilieren.
- B. Lässt sich erfolgreich kompilieren, wirft aber zur Laufzeit eine `NullPointerException`.
- C. Wird geräuschlos beendet.
- D. Lässt sich erfolgreich kompilieren, wirft aber zur Laufzeit eine `NullArgumentException`.

**Answer: B**
**Detailed Explanation:**
- Die Anweisung `throw null;` ist syntaktisch gültig, da `null` jeden Referenztyp darstellen kann, einschließlich Unterklassen von `Throwable`. Daher wird sie ohne Fehler kompiliert.
- Wenn die JVM zur Laufzeit die throw-Anweisung ausführt und eine Null-Referenz anstelle eines gültigen `Throwable`-Objekts vorfindet, wirft sie stattdessen sofort eine **`NullPointerException`**.

---

### Frage 9: Design des Abfangens von AssertionError
Was ist die Ausgabe bei der Ausführung des folgenden Programms mit aktivierten Assertions (`-ea`)?
```java
public class AssertCatch {
    public static void main(String[] args) {
        int x = 5;
        try {
            assert x < 3 : "CheckFailed";
        } catch (Throwable t) {
            System.out.println(t.getMessage());
        }
    }
}
```
- A. `CheckFailed`
- B. Nichts wird ausgegeben.
- C. Lässt sich nicht kompilieren, da `AssertionError` keine Unterklasse von `Throwable` ist.
- D. Das Programm stürzt mit einer unbehandelten Exception ab.

**Answer: A**
**Detailed Explanation:**
- Wenn eine Assertion fehlschlägt, wirft die JVM einen `AssertionError`.
- `AssertionError` erbt von `Error`, welcher wiederum von `Throwable` erbt.
- Da der Catch-Block `Throwable` abfängt, fängt er den geworfenen `AssertionError` ab.
- `t.getMessage()` ruft den Wert des Detail-Meldungsausdrucks ab, welcher `"CheckFailed"` ist.
- Ausgabe: `CheckFailed`.

---

### Frage 10: Immutabilität der Exception-Variable im Multi-Catch
Was ist das Ergebnis beim Kompilieren der folgenden Klasse?
```java
import java.io.*;
public class MultiCatchVar {
    public static void main(String[] args) {
        try {
            if (true) throw new IOException();
        } catch (IOException | NullPointerException e) {
            e = new IOException(); // Line 6
        }
    }
}
```
- A. Lässt sich erfolgreich kompilieren.
- B. Lässt sich wegen Zeile 6 nicht kompilieren, da `e` implizit final ist.
- C. Lässt sich nicht kompilieren, da `IOException` und `NullPointerException` inkompatibel sind.
- D. Wirft zur Laufzeit eine `ClassCastException`.

**Answer: B**
**Detailed Explanation:**
- In einem Multi-Catch-Block ist der abgefangene Exception-Parameter (`e` in `catch (IOException | NullPointerException e)`) **implizit final**.
- Sie können die Exception-Variable `e` innerhalb des Catch-Blocks nicht neu zuweisen oder modifizieren.
- Daher führt Zeile 6 (`e = new IOException();`) zu einem Compilerfehler: `multi-catch parameter e may not be assigned` (dem Multi-Catch-Parameter e darf nichts zugewiesen werden).

---

### Frage 11: In statischem Initialisierer vs. Instanz geworfene Exception
Was passiert, wenn Sie versuchen, das folgende Programm zu kompilieren und auszuführen?
```java
public class StaticException {
    static {
        if (true) throw new NullPointerException("StaticError");
    }
    public static void main(String[] args) {
        System.out.println("Main");
    }
}
```
- A. Gibt `Main` aus.
- B. Wirft zur Laufzeit eine `NullPointerException`.
- C. Wirft zur Laufzeit einen `java.lang.ExceptionInInitializerError`.
- D. Lässt sich nicht kompilieren, da statische Blöcke keine Exceptions werfen können.

**Answer: C**
**Detailed Explanation:**
- Wenn eine unbehandelte Runtime-Exception (wie `NullPointerException`) innerhalb eines statischen Initialisierungsblocks geworfen wird, fängt der Classloader der JVM diese ab und verpackt sie in einen **`java.lang.ExceptionInInitializerError`**.
- Dieser Fehler tritt auf, wenn die Klasse zum ersten Mal geladen wird, noch bevor die `main`-Methode mit der Ausführung beginnt.
- Daher wird die Anwendung mit einem `ExceptionInInitializerError` beendet.

---

### Frage 12: Regeln für das Überschreiben von Returns im Try-Catch-Finally
Was ist der Rückgabewert der folgenden Methode?
```java
public static int getVal() {
    try {
        throw new Exception();
    } catch (Exception e) {
        return 1;
    } finally {
        return 2;
    }
}
```
- A. `1`
- B. `2`
- C. Wirft zur Laufzeit eine `Exception`.
- D. Lässt sich nicht kompilieren, da `return` in `finally`-Blöcken unzulässig ist.

**Answer: B**
**Detailed Explanation:**
- Ein `finally`-Block wird immer ausgeführt.
- Wenn der `finally`-Block ein `return`-Statement ausführt, **überschreibt** dies jedes vorherige Return- oder Throw-Statement, das in den `try`- oder `catch`-Blöcken aussteht.
- In dieser Methode:
  - Wirft der `try`-Block eine Exception.
  - Fängt der `catch`-Block diese ab und plant einen Rückgabewert von `1` ein.
  - Vor der Rückgabe wird der `finally`-Block ausgeführt und ruft `return 2;` auf.
  - Das Return von `2` überschreibt das Return des Catch-Blocks von `1`. Die Methode gibt `2` zurück.

---

### Frage 13: Überschreiben der close-Methode von AutoCloseable und Checked Exceptions
Welche der folgenden Deklarationen sind ein gültiges Überschreiben der im `AutoCloseable`-Interface deklarierten Methode `close()`? (Wählen Sie alle zutreffenden Antworten aus)
- A. `public void close() throws Exception {}`
- B. `public void close() throws java.io.IOException {}`
- C. `public void close() {}`
- D. `private void close() {}`
- E. `public void close() throws RuntimeException {}`

**Answer: A, B, C, E**
**Detailed Explanation:**
- Das `AutoCloseable`-Interface deklariert die Methode: `public void close() throws Exception;`.
- Unterklassen, die diese Methode überschreiben, können:
  - dieselbe Exception deklarieren (`throws Exception`).
  - eine spezifischere (engere) geprüfte Exception deklarieren (wie `throws IOException`).
  - beliebige ungeprüfte Exceptions deklarieren (wie `throws RuntimeException`).
  - **überhaupt keine Exceptions** deklarieren (z. B. `public void close()`). Dies wird dringend empfohlen, um zu vermeiden, dass Aufrufer gezwungen sind, try-catch-Blöcke zu verwenden.
- **D ist falsch:** Es schränkt die Sichtbarkeit von `public` auf `private` ein.

---

### Frage 14: Teilweises Fehlschlagen bei Try-With-Resources
Was passiert, wenn die Initialisierung von `r2` in der folgenden Anweisung fehlschlägt (eine Exception wirft)?
`try (Res r1 = new Res("A"); Res r2 = new Res("B")) { ... }`
- A. `r1` bleibt geöffnet, da der Try-Block nie ausgeführt wurde.
- B. `r1` wird automatisch geschlossen und anschließend wird die Initialisierungs-Exception von `r2` geworfen.
- C. Die JVM stürzt mit einer unbehandelten doppelten Exception ab.
- D. Sowohl `r1` als auch `r2` werden geschlossen.

**Answer: B**
**Detailed Explanation:**
- Wenn in einer Try-With-Resources-Anweisung eine Ressource nicht initialisiert werden kann (z. B. wenn der Konstruktor von `r2` eine Exception wirft):
  - Stoppt die JVM sofort jede weitere Initialisierung.
  - Schließt sie automatisch **alle Ressourcen, die bereits erfolgreich initialisiert wurden** (hier wird `r1` geschlossen).
  - Danach wird die vom Konstruktor von `r2` geworfene Exception weitergegeben.
- Daher ist garantiert, dass `r1` sicher geschlossen wird.

---

### Frage 15: Klassifizierung der Vererbung von Checked Exceptions
Welche der folgenden Klassen erbt direkt von `Throwable`, wird aber als **Checked Exception (geprüfte Exception)** klassifiziert?
- A. `java.lang.Error`
- B. `java.lang.RuntimeException`
- C. `java.lang.Exception` (ausgenommen Unterklassen von `RuntimeException`)
- D. `java.lang.NullPointerException`

**Answer: C**
**Detailed Explanation:**
- Die Klasse `Throwable` hat zwei Hauptunterklassen: `Error` und `Exception`.
- `Error` und seine Unterklassen sind ungeprüft (unchecked).
- `Exception` und seine Unterklassen, **ausgenommen Unterklassen von `RuntimeException`**, sind geprüfte Exceptions (checked).
- Unterklassen von `RuntimeException` sind ungeprüft (unchecked).
- Daher ist C korrekt.

---

### Frage 16: Konstruktor-Parameter von AssertionError
Welche der folgenden Optionen sind eine gültige Syntax für eine Assertion-Anweisung in Java? (Wählen Sie alle zutreffenden Antworten aus)
- A. `assert (x > 0);`
- B. `assert x > 0 : "Invalid";`
- C. `assert x > 0 : new Object();`
- D. `assert x > 0 : voidMethod();` // voidMethod() gibt void zurück

**Answer: A, B, C**
**Detailed Explanation:**
- Die Assertion-Syntax lautet `assert <booleanExpression> : <messageExpression>;`.
- Der Meldungsausdruck (message expression) kann ein beliebiger Ausdruck sein, der **zu einem Wert ausgewertet wird** (wie ein String, ein primitiver Typ oder ein Objekt). Dieser Wert wird in einen String konvertiert und an den Konstruktor von `AssertionError` übergeben, wenn die Assertion fehlschlägt.
- **D ist ungültig**, da eine Methode, die `void` zurückgibt, nicht zu einem Wert ausgewertet wird, was zu einem Compilerfehler führt.

---

### Frage 17: Implizites Werfen von Checked Exceptions in der Main-Methode
Was passiert, wenn ein Programm eine geprüfte Exception (checked) innerhalb der `main`-Methode wirft, die Signatur der `main`-Methode diese jedoch nicht in einer `throws`-Klausel deklariert?
- A. Der Code lässt sich kompilieren, gibt aber eine Warnung aus.
- B. Der Code lässt sich nicht kompilieren.
- C. Die Exception wird zur Laufzeit geräuschlos ignoriert.
- D. Die JVM verpackt sie automatisch in eine `RuntimeException`.

**Answer: B**
**Detailed Explanation:**
- Geprüfte Exceptions (checked) müssen der "Handle-or-Declare"-Regel folgen (entweder abfangen oder deklarieren).
- Wenn eine geprüfte Exception innerhalb von `main` geworfen wird, muss sie entweder in einem Try-Catch-Block abgefangen oder in der Signatur der `main`-Methode deklariert werden: `public static void main(String[] args) throws Exception`.
- Wenn keines von beiden geschieht, schlägt die Kompilierung fehl.

---

### Frage 18: Verhalten von Threads bei einer unbehandelten RuntimeException
Was passiert mit einer laufenden Java-Anwendung, wenn ein Thread eine unbehandelte `RuntimeException` wirft?
- A. Die gesamte JVM fährt sofort herunter.
- B. Der Thread, der die Exception geworfen hat, wird beendet, während andere Nicht-Daemon-Threads weiterlaufen.
- C. Die Exception wird automatisch abgefangen und protokolliert, und der Thread läuft weiter.
- D. Der Thread wechselt in einen suspendierten Zustand.

**Answer: B**
**Detailed Explanation:**
- Wenn ein Thread eine unbehandelte Exception wirft (geprüft oder ungeprüft), wird der Thread beendet.
- Dies stoppt jedoch **nicht** die gesamte JVM, es sei denn, es war der einzige verbleibende Nicht-Daemon-Thread im System. Andere aktive Threads (wie der Main-Thread oder benutzerdefinierte Threads) laufen weiter.

---

### Frage 19: Standardverhalten bei der Auswertung von Assertions zur Laufzeit
Wenn eine Java-Anwendung ohne Befehlszeilen-Flags gestartet wird (z. B. `java MyApp`), was ist der Standardstatus von `assert`-Anweisungen?
- A. Sie werden ausgewertet und werfen bei Fehlschlag einen `AssertionError`.
- B. Sie werden zur Laufzeit komplett ignoriert (kein Performance-Overhead).
- C. Sie erzeugen Log-Einträge, werfen aber keine Fehler.
- D. Der Compiler generiert keinen Bytecode für Assertions, es sei denn, `-ea` wird beim Kompilieren angegeben.

**Answer: B**
**Detailed Explanation:**
- Standardmäßig sind Assertions zur Laufzeit **deaktiviert**.
- Die JVM überspringt den Bytecode für Assertions, was bedeutet, dass sie keinen Einfluss auf die Performance haben.
- Um sie zu aktivieren, müssen Sie der JVM explizit das Flag `-ea` (oder `-enableassertions`) übergeben.

---

### Frage 20: Werfen von Unterklassen-Checked-Exceptions beim Überschreiben
Wenn eine Methode der Elternklasse `public void run() throws java.io.IOException` deklariert, welche der folgenden throws-Deklarationen sind in einer überschreibenden Methode der Unterklasse gültig? (Wählen Sie alle zutreffenden Antworten aus)
- A. `public void run() throws Exception`
- B. `public void run() throws java.io.FileNotFoundException`
- C. `public void run() throws RuntimeException`
- D. `public void run() {}`

**Answer: B, C, D**
**Detailed Explanation:**
- Eine überschreibende Methode in einer Unterklasse:
  - **darf keine breiteren geprüften Exceptions werfen** (A ist ungültig, da `Exception` breiter als `IOException` ist).
  - **kann spezifischere (engere) geprüfte Exceptions werfen** (B ist gültig, da `FileNotFoundException` eine Unterklasse von `IOException` ist).
  - **kann beliebige ungeprüfte Exceptions werfen** (C ist gültig, da `RuntimeException` ungeprüft ist).
  - **kann gar keine Exceptions werfen** (D ist gültig).
- Daher sind B, C und D gültig.

