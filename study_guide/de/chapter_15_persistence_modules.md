# Kapitel 15: NIO.2, Serialization & Java Modules (JPMS)

## 1. Core Java 21 Prüfungsziele
- NIO.2 Path-Operationen beherrschen: `resolve()`, `relativize()` und `normalize()`.
- Datei-Metadaten mithilfe von `BasicFileAttributes` auslesen.
- Objekt-Serialisierung implementieren und `transient`-Felder nutzen.
- Die Direktiven des Java Platform Module System (JPMS) verstehen: `exports`, `requires`, `requires transitive`, `opens`, `uses`, `provides...with`.
- Befehlszeilensyntax (Command-Line) zum Kompilieren, Paketieren und Ausführen modularer Java-Anwendungen auswendig lernen.

---

## 2. Detaillierte Konzepte

### NIO.2 Path-Relocation-Mechanik
Pfad-Manipulationen greifen nicht auf das physische Dateisystem zu; es handelt sich um rein syntaktische String-Operationen auf Pfad-Ebene.
- **`resolve(Path other)`:** Verbindet zwei Pfade. Wenn `other` absolut ist, wird einfach `other` zurückgegeben.
- **`relativize(Path other)`:** Berechnet den relativen Pfad vom aktuellen Pfad zu `other` (d. h. "Wie gelange ich von Pfad A zu Pfad B?").
- **`normalize()`:** Entfernt redundante Pfadelemente wie `.` (aktuelles Verzeichnis) und `..` (Elternverzeichnis).

```java
Path p1 = Paths.get("/home/user");
Path p2 = Paths.get("/home/user/docs/file.txt");
Path relative = p1.relativize(p2); // docs/file.txt
```

### JPMS Modul-Direktiven
Ein Modul deklariert Abhängigkeiten und Barrierefreiheiten in seiner `module-info.java` Datei:
- **`requires M`:** Gibt an, dass dieses Modul vom Modul `M` abhängt.
- **`requires transitive M`:** Deklariert eine Abhängigkeit von `M` und macht diese automatisch für alle anderen Module lesbar, die von diesem Modul abhängen (Abhängigkeitsweiterleitung).
- **`exports P`:** Gibt das Paket `P` für andere Module zur Verwendung frei.
- **`opens P`:** Gewährt zur Laufzeit reflexiven Zugriff auf das Paket `P`, verhindert jedoch Importe zur Compile-Zeit.
- **`provides S with I`:** Registriert die Klasse `I` als Implementierung des Service-Interfaces `S`.
- **`uses S`:** Deklariert, dass dieses Modul zur Laufzeit nach Implementierungen des Service-Interfaces `S` sucht.

---

## 3. JVM-Interna & Speicherlayout

### JPMS-Kapselungserzwingung
Zur Laufzeit baut die JVM einen Modulgraphen auf.
- Klassen in nicht-exportierten Paketen sind vollständig gekapselt.
- Selbst wenn Sie Typumwandlungen (Castings) verwenden oder Reflexion erzwingen (`Field.setAccessible(true)`), wirft die JVM-Laufzeitumgebung eine `InaccessibleObjectException`, wenn das Paket in seiner `module-info.java` nicht explizit per `exports` oder `opens` freigegeben ist.

### Serialisierung: `serialVersionUID`-Validierung
Bei der Deserialisierung eines Objekts liest die JVM den Binärstrom und verifiziert die Klassen-Metadaten.
- Wenn der Datenstrom eine andere `serialVersionUID` enthält als die lokal geladene Klasse, wirft die JVM eine `InvalidClassException`.
- Wenn Sie keine `serialVersionUID` deklarieren, berechnet der Compiler einen standardmäßigen 64-Bit-Hashwert basierend auf den Feldern und Methoden der Klasse. Jede Änderung an einem Klassenmitglied (selbst das Hinzufügen eines privaten Feldes) ändert diesen Hashwert, was die Kompatibilität mit zuvor gespeicherten Dateien bricht. Deklarieren Sie diese ID daher immer explizit:
  `private static final long serialVersionUID = 1L;`

---

## 4. Tricky OCP Exam Questions

### Frage 1
Was ist das Ergebnis der Ausführung des folgenden Codesegments?
```java
import java.nio.file.*;

public class PathRelativize {
    public static void main(String[] args) {
        Path p1 = Paths.get("/home/user");
        Path p2 = Paths.get("docs/file.txt");
        try {
            Path relative = p1.relativize(p2);
            System.out.println(relative);
        } catch (IllegalArgumentException e) {
            System.out.println("IAE");
        } catch (Exception e) {
            System.out.println("Exception");
        }
    }
}
```
- A. `docs/file.txt`
- B. `../../docs/file.txt`
- C. `IAE`
- D. `Exception`

**Antwort: C**
**Ausführliche Erklärung:**
- **NIO.2 Relativize-Einschränkungen:** Die Methode `relativize(Path)` bestimmt den relativen Pfad von einem Pfad zu einem anderen.
- **Wichtige Regel:** Beide Pfade müssen **entweder beide absolut oder beide relativ** sein.
- Da `p1` ein absoluter Pfad ist (`/home/user`) und `p2` ein relativer Pfad ist (`docs/file.txt`), schlägt der Aufruf zur Laufzeit fehl und wirft eine `IllegalArgumentException` (was `IAE` ausgibt).

---

### Frage 2
Gegeben sei die Pfaddarstellung `/root/sub1/sub2/file.txt` auf einem UNIX-System. Was ist die Ausgabe des folgenden Codes?
```java
import java.nio.file.*;

public class PathSubpath {
    public static void main(String[] args) {
        Path path = Paths.get("/root/sub1/sub2/file.txt");
        System.out.print(path.getNameCount() + " " + path.subpath(0, 2));
    }
}
```
- A. `5 /root/sub1`
- B. `4 root/sub1`
- C. `5 root/sub1`
- D. `4 /root/sub1`

**Antwort: B**
**Ausführliche Erklärung:**
- **Zählen von Pfadelementen:**
  - Das Root-Element (`/` unter UNIX oder `C:\` unter Windows) zählt **nicht** als Namenselement und wird von `getNameCount()` ignoriert.
  - Die Namenselemente sind: `root` (Index 0), `sub1` (Index 1), `sub2` (Index 2) und `file.txt` (Index 3). Folglich gibt `getNameCount()` `4` zurück.
  - `path.subpath(begin, end)` gibt einen Teilpfad von `begin` (inklusive) bis `end` (**exklusive**) zurück. Daher gibt `subpath(0, 2)` die Elemente bei Index 0 und 1 zurück: `root/sub1`.
  - Wichtig: Der zurückgegebene Teilpfad enthält niemals die Root-Komponente, selbst wenn der ursprüngliche Pfad absolut war.
  - Die Ausgabe ist `4 root/sub1`.

---

### Frage 3
Betrachten Sie die folgende Klassenhierarchie für die Serialisierung:
```java
import java.io.*;

class SuperClass {
    public SuperClass(int x) {}
}

class SubClass extends SuperClass implements Serializable {
    private static final long serialVersionUID = 1L;
    private int value;
    public SubClass(int x, int value) {
        super(x);
        this.value = value;
    }
}
```
Wenn eine Instanz von `SubClass` serialisiert und anschließend deserialisiert wird, was ist die Folge?
- A. Die Instanz wird erfolgreich deserialisiert, wobei ihre Felder intakt bleiben.
- B. Die Serialisierung wirft eine `NotSerializableException`.
- C. Die Deserialisierung wirft zur Laufzeit eine `InvalidClassException`, da der Superklasse ein argumentloser Konstruktor fehlt.
- D. Die Deserialisierung gelingt, aber die Felder der Superklasse werden fehlerfrei mit Standardwerten initialisiert.

**Antwort: C**
**Ausführliche Erklärung:**
- **Vererbungsvorschriften bei der Serialisierung:**
  - Wenn eine Klasse `Serializable` implementiert, ihre Elternklasse (`SuperClass`) jedoch nicht, muss die Elternklasse während des Deserialisierungsprozesses initialisiert werden.
  - Hierzu muss die JVM den **argumentlosen Konstruktor** (parameterlosen Konstruktor) der ersten nicht-serialisierbaren Elternklasse in der Vererbungskette aufrufen.
  - Da `SuperClass` nur einen `SuperClass(int)`-Konstruktor und keinen Standardkonstruktor besitzt, schlägt die Deserialisierung zur Laufzeit mit einer `InvalidClassException` (oder einer Unterklasse davon) fehl.

---

### Frage 4
Welche der folgenden JPMS-Direktiven deklariert, dass eine Abhängigkeit zur Compile-Zeit erforderlich, zur Laufzeit jedoch optional ist?
- A. `requires optional M;`
- B. `requires static M;`
- C. `requires transitive M;`
- D. `opens M;`

**Antwort: B**
**Ausführliche Erklärung:**
- **Statische JPMS-Abhängigkeit:** Die Direktive `requires static M;` deklariert eine Abhängigkeit, die zur **Compile-Zeit** zwingend erforderlich, zur **Laufzeit** jedoch **optional** ist (der Klassenlader der JVM verlangt ihre Anwesenheit nicht, solange nicht darauf zugegriffen wird).
- `requires transitive` (C) macht die Abhängigkeit für andere Module sichtbar, die dieses Modul erfordern. `opens` (D) wird verwendet, um Reflexion zur Laufzeit zu ermöglichen. `requires optional` (A) ist keine gültige JPMS-Syntax.

---

### Frage 5
Angenommen, eine modulare Anwendung verwendet das Service Provider Interface (SPI). Das Modul `com.test.consumer` konsumiert ein Service-Interface `com.test.Service`. Das Modul `com.test.provider` stellt eine Implementierung `com.test.impl.ServiceImpl` bereit.
Welche Deklarationen sind für die jeweiligen `module-info.java`-Dateien korrekt? (Wählen Sie zwei)
- A. Im Consumer: `provides com.test.Service;`
- B. Im Consumer: `uses com.test.Service;`
- C. Im Provider: `provides com.test.Service with com.test.impl.ServiceImpl;`
- D. Im Provider: `uses com.test.impl.ServiceImpl with com.test.Service;`

**Antwort: B, C**
**Ausführliche Erklärung:**
- **SPI-Modul-Direktiven:**
  - Der Konsument (Consumer) eines Service muss deklarieren, dass er die Schnittstelle verwendet: `uses <schnittstellen-name>;` (Option B).
  - Der Anbieter (Provider) eines Service registriert seine Implementierung für die Schnittstelle: `provides <schnittstellen-name> with <implementierungs-klasse>;` (Option C).
  - Option A ist unvollständig, da `provides` immer eine `with`-Klausel erfordert. Option D vertauscht die Argumente.

---

### Frage 6
Was ist das Ergebnis der Ausführung der folgenden Pfad-Operation?
```java
Path p1 = Paths.get("/user/home");
Path p2 = Paths.get("/user/home/docs");
System.out.println(p2.resolve(p1));
```
- A. `/user/home/docs/user/home`
- B. `/user/home`
- C. `/user/home/docs`
- D. Wirft eine `IllegalArgumentException`, da beide Pfade absolut sind.

**Antwort: B**
**Ausführliche Erklärung:**
- **resolve mit absolutem Pfad:**
  - Die Methode `resolve(Path other)` wird verwendet, um Pfade zu kombinieren.
  - **Besondere Regel:** Wenn das übergebene Argument `other` ein **absoluter Pfad** ist (wie hier `p1` = `/user/home`), stoppt die Auflösung und die Methode gibt einfach den übergebenen absoluten Pfad `other` unverändert zurück.
  - Daher gibt `p2.resolve(p1)` direkt `/user/home` zurück.

---

### Frage 7
Betrachten Sie die Serialisierung der folgenden Klasse:
```java
import java.io.Serializable;

public class Employee implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    private transient Thread workerThread;
    private transient int age;
}
```
Nach der Serialisierung und der anschließenden Deserialisierung, welche Werte haben `workerThread` und `age` in der wiederhergestellten Instanz?
- A. `null` und `0`
- B. Die ursprüngliche `Thread`-Referenz und `0`
- C. `null` und der ursprüngliche `age`-Wert
- D. Die Serialisierung schlägt fehl, da `Thread` nicht serialisierbar ist.

**Antwort: A**
**Ausführliche Erklärung:**
- **Transient-Felder:** 
  - Felder, die mit dem Schlüsselwort `transient` markiert sind, werden während des Serialisierungsprozesses vollständig ignoriert. Ihr Zustand wird nicht in den Datenstrom geschrieben.
  - Da `Thread` nicht serialisierbar ist, muss es als `transient` markiert werden, da die Serialisierung andernfalls mit einer `NotSerializableException` abbrechen würde (wodurch D falsch ist).
  - Bei der Deserialisierung werden transiente Felder auf ihre standardmäßigen Java-Werte zurückgesetzt: Referenztypen (`workerThread`) auf `null` und primitive numerische Typen (`age`) auf `0`.

---

### Frage 8
Welcher der folgenden Befehle beschreibt die Modulabhängigkeiten eines kompilierten Moduls, das in einer JAR-Datei namens `core.jar` verpackt ist, korrekt?
- A. `jar --describe-module --file=core.jar`
- B. `java --describe-module core.jar`
- C. `javac --describe-module core.jar`
- D. `jar --show-module core.jar`

**Antwort: A**
**Ausführliche Erklärung:**
- **Befehl zur Modulinspektion:** Um die Metadaten (`module-info.class`) einer verpackten modularen JAR-Datei zu inspizieren, verwenden Sie das Tool `jar` mit den Flags `--describe-module` (oder `-d`) und `--file` (oder `-f`), gefolgt vom Dateinamen (Option A).
- Die Optionen B, C und D bieten diese Funktionalität in dieser Syntax nicht.

---

### Frage 9
Was ist der Unterschied zwischen `Files.walk(Path)` und `Files.find(Path, int, BiPredicate, FileVisitOption...)`?
- A. `Files.walk` wertet Dateien gierig (eager) aus, während `Files.find` träge (lazy) ist.
- B. `Files.find` ermöglicht die Angabe einer maximalen Tiefe und eines Filters für Attribute, während `Files.walk` alle Dateien bis zur maximalen Tiefe ohne Metadatenfilter durchläuft.
- C. `Files.walk` folgt standardmäßig symbolischen Links, wohingegen `Files.find` dies nicht tut.
- D. Es gibt keinen Unterschied; `Files.walk` ruft intern `Files.find` auf.

**Antwort: B**
**Ausführliche Erklärung:**
- Beide Methoden geben einen träge ausgewerteten `Stream<Path>` zurück.
- `Files.find` erfordert jedoch direkt Parameter für eine maximale Suchtiefe (`maxDepth`) und ein Filter-Prädikat (`BiPredicate`), dem sowohl der Pfad als auch seine Dateiattribute (`BasicFileAttributes`) übergeben werden. Dies ermöglicht hocheffiziente Suchen basierend auf Metadaten (z. B. Dateigröße oder Änderungsdatum).
- `Files.walk` durchläuft standardmäßig den gesamten Baum und bietet keinen integrierten Attributfilter.
- Beide Methoden folgen standardmäßig **nicht** symbolischen Links (es sei denn, `FOLLOW_LINKS` wird explizit übergeben).

---

### Frage 10
Welche JPMS-Direktive gewährt Compile-Zeit-Zugriff auf ein Paket `com.core.utils` für **ausschließlich** ein bestimmtes Modul `com.app.ui`?
- A. `exports com.core.utils to com.app.ui;`
- B. `opens com.core.utils to com.app.ui;`
- C. `requires com.app.ui exports com.core.utils;`
- D. `provides com.core.utils with com.app.ui;`

**Antwort: A**
**Ausführliche Erklärung:**
- **Qualifizierte Exporte (Qualified Exports):** 
  - Die Syntax `exports <package> to <module>;` deklariert einen qualifizierten Export. Dies bedeutet, dass der Compile-Zeit-Zugriff auf das Paket ausschließlich auf das angegebene Zielmodul beschränkt ist.
  - `opens...to` (B) gewährt nur reflexiven Zugriff zur Laufzeit auf das Paket, keinen Compile-Zeit-Zugriff.

---

### Frage 11
Was ist das Ergebnis der Ausführung der folgenden Pfad-Operation?
```java
Path p = Paths.get("/etc/./sub/../config.txt");
System.out.println(p.normalize());
```
- A. `/etc/config.txt`
- B. `/etc/sub/config.txt`
- C. `/config.txt`
- D. `/etc/sub/../config.txt`

**Antwort: A**
**Ausführliche Erklärung:**
- **Pfadnormalisierung:**
  - Das Zeichen `.` repräsentiert das aktuelle Verzeichnis und wird entfernt (`/etc/./sub` -> `/etc/sub`).
  - Das Zeichen `..` repräsentiert das Elternverzeichnis und entfernt die unmittelbar vorangehende Verzeichniskomponente (`/etc/sub/../config.txt` -> `/etc/config.txt`).
  - Der normalisierte Pfad lautet `/etc/config.txt`.

---

### Frage 12
Welche der folgenden Aussagen über JPMS Service Provider Lookups ist korrekt?
- A. Der Lookup wird mithilfe der Klasse `java.util.ServiceLoader` durchgeführt.
- B. Das Consumer-Modul muss die Implementierungsklasse explizit aus dem Provider-Modul importieren.
- C. Implementierungen müssen einen öffentlichen Konstruktor ohne Argumente oder eine öffentliche statische Provider-Methode deklarieren.
- D. Sowohl A als auch C sind korrekt.

**Antwort: D**
**Ausführliche Erklärung:**
- **SPI-Service-Lookup:**
  - Services werden zur Laufzeit dynamisch mithilfe der Klasse `ServiceLoader.load(Class)` geladen (A ist korrekt).
  - Der Konsument darf die konkrete Implementierungsklasse nicht direkt kennen oder importieren (B ist falsch, da dies das lose gekoppelte Design von SPI verletzen würde).
  - Der `ServiceLoader` erfordert, dass die Implementierungsklasse entweder einen öffentlichen, argumentlosen Konstruktor oder eine öffentliche, statische Provider-Methode `public static S provider()` besitzt, die die Instanz zurückgibt (C ist korrekt).

---

### Frage 13
Was passiert, wenn Sie versuchen, eine Klasse zu serialisieren, die `Serializable` implementiert, aber eines ihrer nicht-statischen, nicht-transienten Felder auf ein Objekt einer Klasse verweist, die `Serializable` NICHT implementiert?
- A. Das nicht-serialisierbare Objekt wird während der Serialisierung ignoriert.
- B. Der Compiler bricht mit einem Fehler ab.
- C. Die Serialisierung schlägt zur Laufzeit mit einer `NotSerializableException` fehl.
- D. Das Object wird mittels Reflexion serialisiert, aber die Deserialisierung schlägt fehl.

**Antwort: C**
**Ausführliche Erklärung:**
- **Serialisierung von Objektgraphen:**
  - Wenn ein Objekt serialisiert wird, versucht die JVM den gesamten Objektgraphen (alle referenzierten Objekte) zu serialisieren.
  - Wenn ein referenziertes Feld (das weder `static` noch `transient` ist) auf ein Objekt zeigt, das nicht serialisierbar ist, schlägt die Serialisierung sofort zur Laufzeit mit einer `NotSerializableException` fehl.
  - Dies wird vom Compiler nicht überprüft.

---

### Frage 14
Welche der folgenden Methoden der Klasse `Files` greifen zum Zeitpunkt des Aufrufs auf das tatsächliche Dateisystem zu? (Wählen Sie alle zutreffenden Optionen aus)
- A. `Path.toRealPath(LinkOption...)`
- B. `Files.isRegularFile(Path, LinkOption...)`
- C. `Paths.get(String, String...)`
- D. `Path.resolve(Path)`

**Antwort: A, B**
**Ausführliche Erklärung:**
- **Metadaten- und Dateisystemzugriff:**
  - Pfadmanipulationen wie `Paths.get()` (C) oder `Path.resolve()` (D) sind rein syntaktische String-Operationen auf Pfadebene und greifen **nicht** auf das Dateisystem zu.
  - `Path.toRealPath()` (A) greift auf das Dateisystem zu, um symbolische Links aufzulösen und prüft, ob die Datei existiert (wobei eine `IOException` geworfen wird, falls sie nicht existiert).
  - `Files.isRegularFile()` (B) liest Dateiattribute direkt aus dem Dateisystem.

---

### Frage 15
Was ist das Ergebnis des Versuchs, eine Klassendatei namens `module-info.java` zu kompilieren, die den folgenden Code enthält?
```java
import com.test.MyClass;

module my.module {
    requires java.base;
}
```
- A. Kompiliert erfolgreich.
- B. Die Kompilierung schlägt fehl, da `import`-Anweisungen in `module-info.java` nicht zulässig sind.
- C. Die Kompilierung schlägt fehl, da `java.base` implizit importiert wird und nicht explizit per `requires` angegeben werden darf.
- D. Die Kompilierung schlägt fehl, da der Modulname mit der Paketstruktur übereinstimmen muss.

**Antwort: B**
**Ausführliche Erklärung:**
- **Syntaxregeln für module-info.java:**
  - In einer `module-info.java`-Datei sind keine `import`-Anweisungen erlaubt. Es können nur Moduldirektiven deklariert werden.
  - (Hinweis: Die explizite Angabe von `requires java.base;` ist redundant, da jedes Modul implizit von `java.base` abhängt, wird aber vom Compiler toleriert und führt nicht zu einem Kompilierungsfehler).

---

### Frage 16
Angenommen, Sie möchten eine Datei mit NIO.2 kopieren. Wenn die Zieldatei bereits existiert, welche Option sollte an `Files.copy` übergeben werden, um die vorhandene Datei zu überschreiben?
- A. `StandardCopyOption.COPY_ATTRIBUTES`
- B. `StandardCopyOption.REPLACE_EXISTING`
- C. `LinkOption.NOFOLLOW_LINKS`
- D. `StandardCopyOption.OVERWRITE`

**Antwort: B**
**Ausführliche Erklärung:**
- Um eine existierende Zieldatei während eines Kopier- oder Verschiebevorgangs zu überschreiben, muss die Option `StandardCopyOption.REPLACE_EXISTING` übergeben werden. Andernfalls wirft die Methode eine `FileAlreadyExistsException`.

---

### Frage 17
Gegeben sei der folgende Modul-Abhängigkeitsgraph:
- Modul `A` deklariert `requires transitive B;`
- Modul `B` deklariert `requires transitive C;`
- Modul `D` deklariert `requires A;`

Welche Module liest Modul `D` implizit?
- A. Nur `A`
- B. Nur `A` und `B`
- C. `A`, `B` und `C`
- D. Keine; Abhängigkeiten müssen im JPMS immer direkt deklariert werden.

**Antwort: C**
**Ausführliche Erklärung:**
- **Transitive Abhängigkeitsweiterleitung:**
  - Dank `requires transitive` pflanzt sich die Lesbarkeit transitiv fort (kaskadierend).
  - Da `A` transitiv `B` erfordert, liest jedes Modul, das `A` benötigt (wie `D`), automatisch auch `B`.
  - Da `B` transitiv `C` erfordert, liest jedes Modul, das `B` benötigt (und somit auch `D`), automatisch auch `C`.
  - Modul `D` liest folglich implizit `A`, `B` und `C`.

---

### Frage 18
Was ist der Zweck der `opens`-Direktive in einer `module-info.java`-Datei?
- A. Sie erlaubt den Compile-Zeit- und Laufzeitzugriff auf öffentliche Klassen im Paket.
- B. Sie erlaubt den Laufzeitzugriff via Reflexion auf alle Klassen im Paket, verhindert jedoch Compile-Zeit-Importe.
- C. Sie macht das Modul Open-Source.
- D. Sie registriert eine Service-Implementierung.

**Antwort: B**
**Ausführliche Erklärung:**
- **Tiefer reflexiver Zugriff (Deep Reflection):** Die `opens`-Direktive erlaubt externen Modulen zur Laufzeit den Zugriff auf Klassen und deren private Elemente mittels Reflexion (z. B. `setAccessible(true)`).
- Sie verhindert jedoch den normalen Import zur Compile-Zeit. Dies wird häufig für Frameworks wie Spring, Hibernate oder Jackson benötigt.

---

### Frage 19
Was ist das Ergebnis der Ausführung des folgenden Programms?
```java
import java.nio.file.*;

public class PathNameCount {
    public static void main(String[] args) {
        Path path = Paths.get("/");
        System.out.println(path.getNameCount());
    }
}
```
- A. `1`
- B. `0`
- C. Wirft zur Laufzeit eine `NullPointerException`.
- D. Die Kompilierung schlägt fehl.

**Antwort: B**
**Ausführliche Erklärung:**
- Ein Pfad, der ausschließlich aus dem Root-Verzeichnis (`/`) besteht, besitzt null Namenselemente.
- Daher gibt `getNameCount()` `0` zurück.

---

### Frage 20
Welcher der folgenden Befehle führt eine modulare Java-Anwendung mit der Hauptklasse `com.app.Main` innerhalb des Moduls `com.app.module` (mit dem Modulverzeichnis `mods`) korrekt aus?
- A. `java --module-path mods -m com.app.module/com.app.Main`
- B. `java -cp mods com.app.module.com.app.Main`
- C. `java -m mods/com.app.module/com.app.Main`
- D. `java --module mods com.app.Main`

**Antwort: A**
**Ausführliche Erklärung:**
- **Ausführen einer modularen App:** Der Befehl zum Ausführen einer modularen Anwendung lautet `java --module-path <dir> -m <module-name>/<haupt-klasse>`.
- Das Flag `--module-path` kann als `-p` abgekürzt werden, und `-m` steht für `--module`. Option A verwendet die korrekte Syntax.
