# Kapitel 10: Datum, Zeit & Lokalisierung

## 1. Core Java 21 Prüfungsziele
- Datums- und Zeitobjekte mittels `LocalDate`, `LocalTime`, `LocalDateTime`, `ZonedDateTime` und `Instant` erstellen und manipulieren.
- Den Unterschied zwischen `Period` und `Duration` beherrschen.
- Zwischen veränderlichen (mutable) Legacy-Klassen und modernen unveränderlichen (immutable) Date-Time-Klassen differenzieren.
- Datumsangaben, Uhrzeiten, Zahlen und Währungen mittels `DateTimeFormatter` und `NumberFormat` formatieren.
- Anwendungen mittels `Locale` und `ResourceBundle` internationalisieren.

---

## 2. Detaillierte Konzepte

### Die moderne Date-Time API (`java.time`)
Vor Java 8 wurde die Datumsverarbeitung über `java.util.Date` und `Calendar` abgewickelt, welche veränderlich (mutable) und nicht thread-sicher waren. Java 8 führte eine völlig neue, unveränderliche (immutable) und thread-sichere Date-Time API ein.

#### Unveränderliche Kernklassen:
- **`LocalDate`:** Nur Datum (Jahr, Monat, Tag), keine Zeitzone (z. B. `2026-06-12`).
- **`LocalTime`:** Nur Uhrzeit (Stunde, Minute, Sekunde, Nanosekunde), keine Zeitzone (z. B. `19:05:00`).
- **`LocalDateTime`:** Kombiniert Datum und Uhrzeit, keine Zeitzone.
- **`ZonedDateTime`:** Datum und Uhrzeit mit einer spezifischen Zeitzone (z. B. `2026-06-12T19:05:00+02:00[Europe/Berlin]`).
- **`Instant`:** Ein bestimmter Zeitpunkt auf der Zeitachse, dargestellt in UTC (Epochen-Sekunden und Nanosekunden).

#### Period vs. Duration (Häufig in der OCP-Prüfung abgefragt):
- **`Period`:** Datumsbasierte Zeitspanne. Misst die Zeit in **Jahren, Monaten und Tagen** (z. B. 2 Jahre und 3 Tage). Wird zusammen mit `LocalDate` verwendet.
- **`Duration`:** Zeitbasierte Zeitspanne. Misst die Zeit in **Sekunden und Nanosekunden** (dargestellt als Stunden, Minuten, Sekunden). Wird mit zeitbasierten Objekten (`LocalTime`, `LocalDateTime`, `Instant`) verwendet.
- *OCP-Falle:* Der Versuch, eine `Duration` zu einem `LocalDate` (oder eine `Period` mit Monatsangaben zu einer `LocalTime`) zu addieren, wirft zur Laufzeit eine `UnsupportedTemporalTypeException`.

```java
LocalDate date = LocalDate.of(2026, 6, 12);
Period period = Period.ofDays(5);
LocalDate newDate = date.plus(period); // Gültig: 2026-06-17

LocalTime time = LocalTime.of(12, 0);
Duration duration = Duration.ofHours(2);
LocalTime newTime = time.plus(duration); // Gültig: 14:00

// Schlägt zur Laufzeit fehl! LocalDate besitzt keine Zeitkomponenten, um Stunden zu addieren.
LocalDate fail = date.plus(duration); 
```

### Lokalisierung & ResourceBundle
- **`Locale`:** Repräsentiert eine geografische, politische oder kulturelle Region. Erzeugt über statische Konstanten (z. B. `Locale.US`), Konstruktoren oder die ab Java 19 verfügbare Factory `Locale.of("fr", "FR")`.
- **`ResourceBundle`:** Eine Sammlung von Property-Dateien, die lokalisierte Schlüssel-Wert-Textpaare enthalten.
  - Dateinamensschema: `baseName_sprache_land.properties` (z. B. `messages_de_DE.properties`).

---

## 3. JVM-Interna & Speicherlayout

### ResourceBundle Fallback-Auflösung
Wenn Sie ein Resource Bundle mittels `ResourceBundle.getBundle("messages", locale)` anfordern, führt die JVM eine strikte Suche im Classpath durch:
1. Sucht exakt das angeforderte Locale: `messages_de_DE.class` oder `messages_de_DE.properties`.
2. Fällt zurück auf die Sprache: `messages_de.class` oder `messages_de.properties`.
3. Fällt zurück auf das **JVM-Standard-Locale (Default Locale)** (z. B. wenn default US ist, sucht sie `messages_en_US` und dann `messages_en`).
4. Fällt zurück auf das Basis-Bundle: `messages.properties`.
5. Wird das Bundle immer noch nicht gefunden, wirft die JVM eine `MissingResourceException`.

```
Anforderung: de_DE (JVM Default: en_US)
[Suchpfad]
de_DE ---> de ---> en_US ---> en ---> Basis (messages.properties) ---> Exception
```

---

## 4. Knifflige OCP-Prüfungsfragen

### Frage 1
Was ist das Ergebnis der Ausführung des folgenden Codesegments?
```java
LocalDate date = LocalDate.of(2026, 3, 15);
Period period = Period.ofYears(1).ofMonths(2).ofDays(3);
LocalDate next = date.plus(period);
System.out.println(next);
```
- A. `2027-05-18`
- B. `2026-03-18`
- C. `2027-05-15`
- D. Die Kompilierung schlägt fehl, da `Period`-Methoden nicht verkettet werden können.

**Antwort: B**
**Detaillierte Erklärung:**
- **Die Verkettungs-Falle:** Die `ofXXX`-Methoden der Klasse `Period` (`ofYears()`, `ofMonths()`, `ofDays()`) sind statische Factory-Methoden und keine Builder-Methoden.
- Wenn statische Methoden verkettet werden, bezieht sich der Aufruf immer auf den deklarierten Klassentyp und nicht auf das Instanzergebnis der vorherigen Methode.
- Der Ausdruck `Period.ofYears(1).ofMonths(2).ofDays(3)` ist semantisch äquivalent zu `Period.ofDays(3)`. Die vorherigen Aufrufe `ofYears(1)` und `ofMonths(2)` werden ignoriert.
- Daher repräsentiert das `period`-Objekt nur eine Zeitspanne von 3 Tagen. `date.plus(period)` addiert 3 Tage zu `2026-03-15`, was zu `2026-03-18` führt.

---

### Frage 2
Betrachten Sie die Zeitumstellung zur Sommerzeit (Daylight Saving Time, DST) in der Zone `Europe/Berlin`. Am 29. März 2026 springt die Uhr von 02:00 auf 03:00 Uhr vorwärts.
Was ist die Ausgabe des folgenden Codes?
```java
LocalDate date = LocalDate.of(2026, 3, 29);
LocalTime time = LocalTime.of(2, 30);
ZoneId zone = ZoneId.of("Europe/Berlin");
ZonedDateTime zdt = ZonedDateTime.of(date, time, zone);
System.out.println(zdt.getHour() + ":" + zdt.getMinute() + " " + zdt.getOffset());
```
- A. `2:30 +01:00`
- B. `3:30 +02:00`
- C. Löst eine `DateTimeException` aus, da die Uhrzeit 02:30 an diesem Tag nicht existiert.
- D. `2:30 +02:00`

**Antwort: B**
**Detaillierte Erklärung:**
- **DST-Lücken-Anpassung:** Wenn eine lokale Zeit in eine Sommerzeit-Lücke (Vorspringen der Uhr) fällt, existiert die Uhrzeit technisch gesehen nicht (Uhren springen von 02:00 auf 03:00 Uhr).
- Java wirft hier keine Exception, sondern passt die Uhrzeit automatisch an. Gemäß der Java-Spezifikation für `ZonedDateTime.of` wird die lokale Zeit um die Länge der Lücke (normalerweise 1 Stunde) nach vorne verschoben, wobei der neue Offset verwendet wird.
- Daher wird `02:30` (das innerhalb der Lücke liegt) auf `03:30` mit dem Sommer-Offset `+02:00` angepasst.

---

### Frage 3
Betrachten Sie die Zeitumstellung zur Winterzeit (DST-Rückstellung) in der Zone `Europe/Berlin`. Am 25. Oktober 2026 wird die Stunde von 02:00 bis 03:00 Uhr wiederholt (die Uhr wird um 03:00 Uhr wieder auf 02:00 Uhr zurückgestellt).
Was ist die Ausgabe des folgenden Codes?
```java
LocalDate date = LocalDate.of(2026, 10, 25);
LocalTime time = LocalTime.of(2, 30);
ZoneId zone = ZoneId.of("Europe/Berlin");
ZonedDateTime zdt = ZonedDateTime.of(date, time, zone);
System.out.println(zdt.getHour() + ":" + zdt.getMinute() + " " + zdt.getOffset());
```
- A. `2:30 +02:00`
- B. `2:30 +01:00`
- C. `1:30 +01:00`
- D. Löst eine `AmbiguousTimeException` aus.

**Antwort: A**
**Detaillierte Erklärung:**
- **DST-Überlappungs-Anpassung:** Während der Rückstellung (Überlappung) tritt die Stunde zwischen 02:00 und 03:00 Uhr zweimal auf – einmal vor der Umstellung (mit Sommer-Offset `+02:00`) und einmal danach (mit Winter-Offset `+01:00`).
- Standardmäßig löst `ZonedDateTime.of` diese Mehrdeutigkeit auf, indem es den **früheren** Offset verwendet, der vor der Umstellung gültig war (`+02:00`).
- Daher wird `2:30` mit dem Offset `+02:00` erzeugt.

---

### Frage 4
Was ist das Ergebnis der Ausführung des folgenden Codeblocks?
```java
LocalDate date = LocalDate.of(2026, 5, 10);
LocalTime time = LocalTime.of(10, 15);
LocalDateTime dateTime = LocalDateTime.of(date, time);
Duration d = Duration.ofDays(1);
Period p = Period.ofDays(1);

try {
    System.out.print(date.plus(d) + " ");
} catch (Exception e) {
    System.out.print("Err1 ");
}

try {
    System.out.print(time.plus(p) + " ");
} catch (Exception e) {
    System.out.print("Err2 ");
}

try {
    System.out.print(dateTime.plus(d).getDayOfMonth() + " " + dateTime.plus(p).getDayOfMonth());
} catch (Exception e) {
    System.out.print("Err3");
}
```
- A. `2026-05-11 10:15:00 11 11`
- B. `Err1 Err2 11 11`
- C. `Err1 Err2 Err3`
- D. `2026-05-11 Err2 11 11`

**Antwort: B**
**Detaillierte Erklärung:**
- **Kompatibilität von Zeiteinheiten (Temporal Units):** 
  - Eine `Duration` basiert auf zeitbasierten Einheiten (Sekunden, Nanosekunden). `LocalDate` speichert jedoch nur Datumswerte (Jahre, Monate, Tage) und unterstützt keine zeitbasierten Operationen. Daher wirft `date.plus(d)` eine `UnsupportedTemporalTypeException` ("Err1").
  - Eine `Period` basiert auf datumsbasierten Einheiten (Jahre, Monate, Tage). `LocalTime` speichert jedoch nur die Uhrzeit und unterstützt keine datumsbasierten Operationen. Daher wirft `time.plus(p)` ebenfalls eine `UnsupportedTemporalTypeException` ("Err2").
  - `LocalDateTime` enthält sowohl Datums- als auch Zeitinformationen und kann daher sowohl durch eine `Duration` als auch durch eine `Period` modifiziert werden. Sowohl `dateTime.plus(d)` als auch `dateTime.plus(p)` ergeben den 11. Mai 2026.

---

### Frage 5
Was ist das Ergebnis des Kompilierens und Ausführens der folgenden Klasse?
```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class Test {
    public static void main(String[] args) {
        LocalDate d1 = LocalDate.of(2026, 1, 1);
        LocalDate d2 = LocalDate.of(2026, 1, 2);
        long hours = ChronoUnit.HOURS.between(d1, d2);
        System.out.println(hours);
    }
}
```
- A. `24`
- B. Die Kompilierung schlägt fehl.
- C. Löst zur Laufzeit eine `UnsupportedTemporalTypeException` aus.
- D. Löst zur Laufzeit eine `ArithmeticException` aus.

**Antwort: C**
**Detaillierte Erklärung:**
- Die Methode `ChronoUnit.HOURS.between(Temporal, Temporal)` fragt die Stundeneinheit auf den übergebenen temporalen Objekten ab.
- Da `LocalDate` die Stundeneinheit nicht unterstützt (es kennt nur Datumskomponenten), wirft die Methode zur Laufzeit eine `UnsupportedTemporalTypeException`.
- Um den Unterschied in Stunden zu berechnen, müssen die Objekte zuerst in einen Typ konvertiert werden, der Stunden unterstützt (wie `LocalDateTime` oder `ZonedDateTime`).

---

### Frage 6
Welche der folgenden Anweisungen konvertiert eine `LocalDateTime` namens `ldt` in ein `Instant`, das denselben Zeitpunkt in UTC darstellt? (Wählen Sie alle zutreffenden Antworten aus)
- A. `Instant instant = ldt.toInstant();`
- B. `Instant instant = ldt.toInstant(ZoneOffset.UTC);`
- C. `Instant instant = ldt.atZone(ZoneId.of("UTC")).toInstant();`
- D. `Instant instant = Instant.from(ldt);`

**Antwort: B, C**
**Detaillierte Erklärung:**
- **Option A lässt sich nicht kompilieren:** `LocalDateTime` hat keine parameterlose `toInstant()`-Methode, da ihr Zonen-/Offset-Informationen fehlen und sie somit nicht direkt auf einen eindeutigen physischen Zeitpunkt (`Instant`) abgebildet werden kann.
- **Option B ist korrekt:** `LocalDateTime.toInstant(ZoneOffset offset)` konvertiert unter Verwendung des angegebenen Offsets direkt in ein `Instant`.
- **Option C ist korrekt:** `atZone(ZoneId)` konvertiert `LocalDateTime` in `ZonedDateTime`, welche über eine `toInstant()`-Methode verfügt.
- **Option D wirft zur Laufzeit eine DateTimeException:** `Instant.from(TemporalAccessor)` erfordert ein Objekt, das Zonen- oder Offset-Informationen enthält. Da `LocalDateTime` diese nicht besitzt, schlägt der Aufruf zur Laufzeit fehl.

---

### Frage 7
Was ist die Ausgabe des folgenden Codes?
```java
Instant instant = Instant.parse("2026-06-12T12:00:00Z");
try {
    Instant i1 = instant.plus(Duration.ofDays(1));
    System.out.print("D_OK ");
} catch (Exception e) {
    System.out.print("D_ERR ");
}

try {
    Instant i2 = instant.plus(Period.ofDays(1));
    System.out.print("P_OK");
} catch (Exception e) {
    System.out.print("P_ERR");
}
```
- A. `D_OK P_OK`
- B. `D_ERR P_ERR`
- C. `D_OK P_ERR`
- D. `D_ERR P_OK`

**Antwort: C**
**Detaillierte Erklärung:**
- **Unterstützte Einheiten von Instant:** Ein `Instant` repräsentiert einen Zeitpunkt auf der Zeitachse und unterstützt nur zeitbasierte Einheiten bis hin zu `ChronoUnit.DAYS` (definiert als genau 86.400 Sekunden).
- `Duration.ofDays(1)` wird intern als Sekundenwert dargestellt (86.400 Sekunden) und kann problemlos zu einem `Instant` addiert werden. Daher wird `D_OK` ausgegeben.
- `Period.ofDays(1)` ist kalenderbasiert (Jahre, Monate, Tage) und hängt vom Kalendersystem ab. `Instant` unterstützt keine Kalenderberechnungen und wirft beim Hinzufügen einer `Period` eine `UnsupportedTemporalTypeException`. Daher wird `P_ERR` ausgegeben.

---

### Frage 8
Was ist die Ausgabe des folgenden modernen Java-Codes?
```java
Locale loc1 = Locale.of("EN", "us");
Locale loc2 = new Locale.Builder().setLanguage("en").setRegion("US").build();
System.out.print(loc1.equals(loc2) + " " + loc1.getLanguage() + "_" + loc1.getCountry());
```
- A. `false EN_us`
- B. `true en_US`
- C. `false en_US`
- D. Die Kompilierung schlägt fehl, da `Locale.of` in Java 21 keine gültige Factory-Methode ist.

**Antwort: B**
**Detaillierte Erklärung:**
- **Locale-Normalisierung:** Seit Java 19 wird die statische Factory-Methode `Locale.of(...)` anstelle der als veraltet (deprecated) markierten Konstruktoren empfohlen.
- `Locale.of` normalisiert die Argumente automatisch: Der Sprachcode wird in Kleinbuchstaben umgewandelt (`"EN"` -> `"en"`) und der Länder-/Regionscode in Großbuchstaben (`"us"` -> `"US"`).
- Daher besitzen sowohl `loc1` als auch `loc2` dieselben normalisierten Werte (`en` und `US`), weshalb `equals()` den Wert `true` zurückgibt und die Ausgabe `en_US` lautet.

---

### Frage 9
Angenommen, Sie haben die folgenden Ressourcen in Ihrem Classpath:
- `labels.properties` (`title=Base`)
- `labels_de.properties` (`title=Deutsch`)
- `labels_de_DE.properties` (`title=Berlin`)

Wenn das Standard-Locale der JVM `Locale.US` (`en_US`) ist, was ist die Ausgabe der Ausführung von:
```java
ResourceBundle rb = ResourceBundle.getBundle("labels", Locale.of("de", "AT"));
System.out.println(rb.getString("title"));
```
- A. `Berlin`
- B. `Deutsch`
- C. `Base`
- D. Löst eine `MissingResourceException` aus.

**Antwort: B**
**Detaillierte Erklärung:**
- **ResourceBundle-Fallback-Kette:** Die Suche nach einem Resource Bundle folgt einer Kaskade:
  1. `labels_de_AT` (angeforderte Sprache + Land) -> Nicht gefunden.
  2. `labels_de` (nur Sprache) -> Gefunden!
- Da ein passendes Sprach-Bundle (`labels_de.properties`) gefunden wird, stoppt die Suche und dieses Bundle wird geladen. Der Wert von `title` ist dort als `"Deutsch"` definiert.
- Das Standard-Locale `en_US` wird nie geprüft, da die Suche in Schritt 2 erfolgreich war.

---

### Frage 10
Betrachten Sie die folgenden Resource Bundles im Classpath:
- `labels.properties`
  ```properties
  hello=Hello
  goodbye=Goodbye
  ```
- `labels_de.properties`
  ```properties
  hello=Hallo
  ```

Was ist die Ausgabe des folgenden Codes?
```java
ResourceBundle rb = ResourceBundle.getBundle("labels", Locale.GERMAN);
System.out.print(rb.getString("hello") + " " + rb.getString("goodbye"));
```
- A. `Hallo null`
- B. `Hallo Goodbye`
- C. Löst eine `MissingResourceException` aus, da `goodbye` in `labels_de` fehlt.
- D. `Hallo Hello`

**Antwort: B**
**Detaillierte Erklärung:**
- **Vererbung zwischen Eltern- und Kind-Bundles:** Wenn ein Resource Bundle geladen wird, stellt Java eine Eltern-Kind-Vererbungsbeziehung zwischen spezifischeren Bundles und dem Basis-Bundle her.
- `labels_de` ist das Kind-Bundle und `labels` ist das Eltern-Bundle.
- Beim Aufruf von `rb.getString("goodbye")` sucht Java zuerst im Kind-Bundle `labels_de`. Da der Schlüssel dort fehlt, wird die Suche an das Eltern-Bundle `labels` delegiert, wo der Schlüssel `"goodbye"` den Wert `"Goodbye"` besitzt.
- Der Schlüssel `"hello"` wird im Kind-Bundle gefunden und gibt `"Hallo"` zurück. Die Ausgabe ist `Hallo Goodbye`.

---

### Frage 11
Wie verhält sich das folgende Codesegment?
```java
DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
LocalDate date = LocalDate.of(2026, 6, 12);
try {
    String formatted = dtf.format(date);
    System.out.println(formatted);
} catch (Exception e) {
    System.out.println(e.getClass().getSimpleName());
}
```
- A. `2026-06-12 00:00`
- B. `DateTimeException`
- C. `UnsupportedTemporalTypeException`
- D. `IllegalArgumentException`

**Antwort: C**
**Detaillierte Erklärung:**
- **Formattyp-Fehlanpassung:** Das Muster (Pattern) des `DateTimeFormatter` erfordert Stunden- (`HH`) und Minuten- (`mm`) Felder.
- Das übergebene `date`-Objekt ist ein `LocalDate` und besitzt keine Zeitkomponenten.
- Wenn der Formatter versucht, die Stunden und Minuten aus dem `LocalDate`-Objekt zu extrahieren, schlägt dies fehl und es wird eine `UnsupportedTemporalTypeException` geworfen.

---

### Frage 12
Was ist die Ausgabe des folgenden Codes?
```java
import java.text.NumberFormat;
import java.util.Locale;

public class Test {
    public static void main(String[] args) {
        NumberFormat nf = NumberFormat.getInstance(Locale.US);
        try {
            Number num1 = nf.parse("123.456xyz");
            Number num2 = nf.parse("xyz123.456");
            System.out.println(num1 + " " + num2);
        } catch (Exception e) {
            System.out.println("Exception");
        }
    }
}
```
- A. `123.456 123.456`
- B. `123.456 Exception`
- C. `Exception`
- D. `123 Exception`

**Antwort: B**
**Detaillierte Erklärung:**
- **Verhalten von NumberFormat.parse beim Parsen:**
  - Die Methode `parse()` analysiert den String von links nach rechts. Sobald sie auf ein Zeichen stößt, das nicht als Zahl interpretiert werden kann, stoppt sie und gibt die bis dahin geparste Zahl zurück.
  - Bei `"123.456xyz"` wird der Teil `"123.456"` erfolgreich geparst und das nachfolgende `"xyz"` ignoriert. Das Ergebnis ist `123.456`.
  - Bei `"xyz123.456"` beginnt der String mit ungültigen Zeichen. Da das Parsen direkt zu Beginn fehlschlägt, wirft die Methode eine geprüfte (checked) `ParseException`.
  - Der Catch-Block wird ausgeführt und gibt `"Exception"` aus.

---

### Frage 13
Was ist die Ausgabe des folgenden Codes?
```java
NumberFormat shortFmt = NumberFormat.getCompactNumberInstance(Locale.US, NumberFormat.Style.SHORT);
NumberFormat longFmt = NumberFormat.getCompactNumberInstance(Locale.US, NumberFormat.Style.LONG);
System.out.println(shortFmt.format(1500000) + " " + longFmt.format(1500000));
```
- A. `1.5M 1.5 million`
- B. `1.5M 1.5 Million`
- C. `1500K 1.5 million`
- D. `1.5M 1 million`

**Antwort: A**
**Detaillierte Erklärung:**
- **CompactNumberFormat:** Eingeführt, um Zahlen in einem kompakten Stil zu formatieren (z. B. für Dashboards).
- Für `1.500.000` (1,5 Millionen) im `Locale.US`:
  - `Style.SHORT` formatiert dies als `1.5M`.
  - `Style.LONG` formatiert dies als `1.5 million` (mit kleinem "m" in der standardmäßigen US-Lokalisierung).

---

### Frage 14
Welche der folgenden Code-Anweisungen werfen zur Laufzeit eine Exception? (Wählen Sie alle zutreffenden Antworten aus)
- A. `LocalTime.of(24, 0);`
- B. `LocalDate.of(2026, 2, 29);`
- C. `LocalTime.of(23, 59, 59, 1_000_000_000);`
- D. `LocalDateTime.of(2026, 6, 31, 12, 0);`

**Antwort: A, B, C, D**
**Detaillierte Erklärung:**
- **Option A wirft eine DateTimeException:** Stunden müssen im Bereich von `0` bis `23` liegen. `24` ist ungültig.
- **Option B wirft eine DateTimeException:** Das Jahr `2026` ist kein Schaltjahr, weshalb der Februar nur 28 Tage hat. Der 29. Februar 2026 existiert nicht.
- **Option C wirft eine DateTimeException:** Nanosekunden müssen im Bereich von `0` bis `999.999.999` liegen. `1.000.000.000` ist ungültig.
- **Option D wirft eine DateTimeException:** Der Juni hat nur 30 Tage. Der 31. Juni existiert nicht.

---

### Frage 15
Was ist das Ergebnis der Ausführung des folgenden Codes?
```java
LocalDate date = LocalDate.of(2026, 6, 12);
DateTimeFormatter dtf = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.SHORT);
try {
    System.out.println(dtf.format(date));
} catch (Exception e) {
    System.out.println(e.getClass().getSimpleName());
}
```
- A. `6/12/26`
- B. `6/12/26, 12:00 AM`
- C. `DateTimeException`
- D. `UnsupportedTemporalTypeException`

**Antwort: C**
**Detaillierte Erklärung:**
- `DateTimeFormatter.ofLocalizedDateTime(FormatStyle)` erzeugt einen Formatter, der sowohl Datums- als auch Zeitinformationen erfordert.
- Das übergebene Objekt `date` ist ein `LocalDate` (keine Zeitkomponenten).
- Die Formatierung schlägt mit einer `DateTimeException` fehl, da die erforderlichen Zeitfelder fehlen. Hinweis: Im Gegensatz zu Mustern (Patterns), bei denen fehlende Felder eine `UnsupportedTemporalTypeException` auslösen, wirft die Lokalisierungspipeline eine `DateTimeException`, wenn dem Objekt die benötigten temporalen Felder fehlen.

---

### Frage 16
Was ist die Ausgabe des folgenden Programms?
```java
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class Test {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2026, 6, 12);
        LocalDateTime dateTime = LocalDateTime.of(2026, 6, 15, 12, 0);
        
        try {
            long d1 = ChronoUnit.DAYS.between(date, dateTime);
            System.out.print(d1 + " ");
        } catch (Exception e) {
            System.out.print("E1 ");
        }

        try {
            long d2 = ChronoUnit.DAYS.between(dateTime, date);
            System.out.print(d2);
        } catch (Exception e) {
            System.out.print("E2");
        }
    }
}
```
- A. `3 -3`
- B. `3 E2`
- C. `E1 E2`
- D. `E1 -3`

**Antwort: B**
**Detaillierte Erklärung:**
- **Konvertierungen bei ChronoUnit.between:**
  - Die Methode `between(Temporal, Temporal)` konvertiert das zweite Argument in den Typ des ersten Arguments.
  - Im ersten Block (`ChronoUnit.DAYS.between(date, dateTime)`) ist das erste Argument `LocalDate`. Das zweite (`LocalDateTime`) wird in ein `LocalDate` konvertiert (wobei die Zeit abgeschnitten wird), was `2026-06-15` ergibt. Der Unterschied beträgt `3` Tage.
  - Im zweiten Block (`ChronoUnit.DAYS.between(dateTime, date)`) ist das erste Argument `LocalDateTime`. Das zweite (`LocalDate`) muss in ein `LocalDateTime` konvertiert werden. Dies schlägt fehl, da `LocalDate` keine Zeitinformationen besitzt, was zu einer `DateTimeException` (oder `UnsupportedTemporalTypeException`) führt und `"E2"` ausgibt.

---

### Frage 17
Was ist die Ausgabe des folgenden Codes?
```java
double value = 123.456;
DecimalFormat df1 = new DecimalFormat("0000.00");
DecimalFormat df2 = new DecimalFormat("####.####");
System.out.println(df1.format(value) + " | " + df2.format(value));
```
- A. `0123.46 | 123.456`
- B. `123.46 | 0123.4560`
- C. `0123.456 | 123.456`
- D. `123.46 | 123.456`

**Antwort: A**
**Detaillierte Erklärung:**
- **DecimalFormat-Symbole:**
  - Das Symbol `0` steht für eine erforderliche Ziffer. Wenn an dieser Stelle keine Ziffer vorhanden ist, wird `0` ausgegeben (Padding). `"0000.00"` formatiert `123.456` auf zwei Nachkommastellen (gerundet auf `.46`) und füllt den ganzzahligen Teil auf 4 Ziffern auf: `0123.46`.
  - Das Symbol `#` steht für eine optionale Ziffer und gibt nichts aus, wenn dort keine Ziffer vorhanden ist. `"####.####"` formatiert `123.456` ohne führende oder nachfolgende Nullen.

---

### Frage 18
Gegeben sind die folgenden Deklarationen:
```java
ZoneId zone1 = ZoneId.of("+02:00");
ZoneId zone2 = ZoneOffset.ofHours(2);
ZoneId zone3 = ZoneId.of("Europe/Berlin");
```
Welche der folgenden Auswertungen sind wahr? (Wählen Sie alle zutreffenden Antworten aus)
- A. `zone1.equals(zone2)` ergibt `true`.
- B. `zone2.equals(zone3)` ergibt `true`.
- C. `zone3.rules().isFixedOffset()` ergibt `false`.
- D. `zone1 instanceof ZoneOffset` ergibt `true`.

**Antwort: A, C, D**
**Detaillierte Erklärung:**
- **ZoneId vs. ZoneOffset:** 
  - `ZoneOffset` is a subclass of `ZoneId` representing a fixed offset without DST rules.
  - `ZoneId.of("+02:00")` returns a `ZoneOffset` instance. Thus, Option D is true.
  - `ZoneOffset.ofHours(2)` creates the same representation (`+02:00`). Thus, `zone1` and `zone2` are equal (Option A is true).
  - `ZoneId.of("Europe/Berlin")` represents a geographical time zone with dynamic transitions (Daylight Saving Time). It is not equal to a fixed offset `+02:00` (Option B is false) and its offset is not fixed (Option C is true).

---

### Frage 19
Was gibt der folgende Code aus?
```java
Period p1 = Period.ofMonths(15);
Period p2 = Period.ofDays(45);

Period n1 = p1.normalized();
Period n2 = p2.normalized();

System.out.println(n1.getYears() + "y " + n1.getMonths() + "m | " 
                 + n2.getMonths() + "m " + n2.getDays() + "d");
```
- A. `1y 3m | 1m 15d`
- B. `1y 3m | 0m 45d`
- C. `1y 3m | 1m 14d`
- D. Die Kompilierung schlägt fehl, da `normalized()` nur für `Duration` verfügbar ist.

**Antwort: B**
**Detaillierte Erklärung:**
- **Normalisierung bei Period:** Die Methode `normalized()` auf `Period` normalisiert nur Jahre und Monate (da 1 Jahr immer 12 Monate hat).
- `15` Monate werden zu `1` Jahr und `3` Monaten normalisiert.
- Tage können nicht in Monate umgerechnet werden, da die Anzahl der Tage pro Monat variiert. Daher bleibt `Period.ofDays(45)` unverändert als `0` Monate und `45` Tage.

---

### Frage 20
Was ist die Ausgabe des folgenden Programms?
```java
import java.util.List;
import java.util.Locale;

public class Test {
    public static void main(String[] args) {
        List<Locale.LanguageRange> ranges = Locale.LanguageRange.parse("en-US,en;q=0.8");
        List<Locale> locales = List.of(
            Locale.of("de", "DE"), 
            Locale.of("en", "US"), 
            Locale.of("en", "GB")
        );
        List<Locale> result = Locale.filter(ranges, locales);
        System.out.println(result);
    }
}
```
- A. `[en_US]`
- B. `[en_US, en_GB]`
- C. `[de_DE, en_US, en_GB]`
- D. Die Kompilierung schlägt fehl.

**Antwort: B**
**Detaillierte Erklärung:**
- **Locale-Filterung:** Die Methode `Locale.filter` filtert eine Liste von Locales anhand einer Liste von Sprachbereichen (Language Ranges).
- Der Bereich `"en-US"` stimmt exakt mit `en_US` überein.
- Der allgemeine Bereich `"en"` (mit der Gewichtung `q=0.8`) passt auf alle englischen Locales, also sowohl auf `en_US` als auch auf `en_GB`.
- Das deutsche Locale `de_DE` wird herausgefiltert.
- Daher enthält die Ergebnisliste beide englischen Locales (`[en_US, en_GB]`).
