# Chapter 10: Date, Time & Localization

## 1. Core Java 21 Exam Objectives
- Create and manipulate date and time objects using `LocalDate`, `LocalTime`, `LocalDateTime`, `ZonedDateTime`, and `Instant`.
- Difference between `Period` and `Duration`.
- Differentiate between mutable legacy classes and modern immutable date-time classes.
- Format dates, times, numbers, and currencies using `DateTimeFormatter` and `NumberFormat`.
- Internationalize applications using `Locale` and `ResourceBundle`.

---

## 2. Deep-Dive Concepts

### The Modern Date-Time API (`java.time`)
Prior to Java 8, date handling was managed by `java.util.Date` and `Calendar`, which were mutable and not thread-safe. Java 8 introduced a completely new, immutable, and thread-safe Date-Time API.

#### Core Immutable Classes:
- **`LocalDate`:** Date only (year, month, day), no time zone (e.g. `2026-06-12`).
- **`LocalTime`:** Time only (hour, minute, second, nanosecond), no time zone (e.g. `19:05:00`).
- **`LocalDateTime`:** Combines date and time, no time zone.
- **`ZonedDateTime`:** Date and time with a specific time zone (e.g. `2026-06-12T19:05:00+02:00[Europe/Berlin]`).
- **`Instant`:** A specific point in time on the timeline, represented in UTC (epoch seconds and nanoseconds).

#### Period vs. Duration (Highly Tested on OCP):
- **`Period`:** Day-based time span. Measures time in **years, months, and days** (e.g. 2 years and 3 days). Used with `LocalDate`.
- **`Duration`:** Time-based time span. Measures time in **seconds and nanoseconds** (represented as hours, minutes, seconds). Used with time-based objects (`LocalTime`, `LocalDateTime`, `Instant`).
- *OCP Trap:* Trying to add a `Duration` to a `LocalDate` (or a `Period` containing month details to a `LocalTime`) throws a runtime `UnsupportedTemporalTypeException`.

```java
LocalDate date = LocalDate.of(2026, 6, 12);
Period period = Period.ofDays(5);
LocalDate newDate = date.plus(period); // Valid: 2026-06-17

LocalTime time = LocalTime.of(12, 0);
Duration duration = Duration.ofHours(2);
LocalTime newTime = time.plus(duration); // Valid: 14:00

// Fails at runtime! LocalDate has no time components to add hours.
LocalDate fail = date.plus(duration); 
```

### Localization & ResourceBundle
- **`Locale`:** Represents a geographical, political, or cultural region. Created using static constants (e.g. `Locale.US`), constructors, or Java 19+ factory `Locale.of("fr", "FR")`.
- **`ResourceBundle`:** A collection of property files containing localized key-value text pairs. 
  - File naming pattern: `baseName_language_country.properties` (e.g., `messages_de_DE.properties`).

---

## 3. JVM Internals & Memory Layout

### ResourceBundle Fallback Resolution
When you request a resource bundle via `ResourceBundle.getBundle("messages", locale)`, the JVM performs a strict search in its classpath:
1. Matches the exact requested locale: `messages_de_DE.class` or `messages_de_DE.properties`.
2. Falls back to language only: `messages_de.class` or `messages_de.properties`.
3. Falls back to the **JVM Default Locale** (e.g., if default is US, checks `messages_en_US` then `messages_en`).
4. Falls back to the base bundle: `messages.properties`.
5. If still not found, throws a `MissingResourceException`.

```
Requested: de_DE (JVM Default: en_US)
[Search Path]
de_DE ---> de ---> en_US ---> en ---> base (messages.properties) ---> Exception
```

---

## 4. Tricky OCP Exam Questions

### Question 1
What is the result of executing the following code segment?
```java
LocalDate date = LocalDate.of(2026, 3, 15);
Period period = Period.ofYears(1).ofMonths(2).ofDays(3);
LocalDate next = date.plus(period);
System.out.println(next);
```
- A. `2027-05-18`
- B. `2026-03-18`
- C. `2027-05-15`
- D. Compilation fails because `Period` methods cannot be chained.

**Answer: B**
**Detailed Explanation:**
- **The Chaining Trap:** The `ofXXX` methods of the `Period` class (`ofYears()`, `ofMonths()`, `ofDays()`) are static factory methods, not builder methods.
- When static methods are chained, the call always refers to the declared class type rather than the instance result of the previous method.
- The expression `Period.ofYears(1).ofMonths(2).ofDays(3)` is semantically equivalent to `Period.ofDays(3)`. The previous calls `ofYears(1)` and `ofMonths(2)` are ignored.
- Therefore, the `period` object represents only a span of 3 days. `date.plus(period)` adds 3 days to `2026-03-15`, resulting in `2026-03-18`.

---

### Question 2
Consider the Daylight Saving Time (DST) spring-forward transition in the `Europe/Berlin` zone. On March 29, 2026, clocks skip forward from 02:00 to 03:00.
What is the output of the following code?
```java
LocalDate date = LocalDate.of(2026, 3, 29);
LocalTime time = LocalTime.of(2, 30);
ZoneId zone = ZoneId.of("Europe/Berlin");
ZonedDateTime zdt = ZonedDateTime.of(date, time, zone);
System.out.println(zdt.getHour() + ":" + zdt.getMinute() + " " + zdt.getOffset());
```
- A. `2:30 +01:00`
- B. `3:30 +02:00`
- C. Throws a `DateTimeException` because the time 02:30 does not exist on that day.
- D. `2:30 +02:00`

**Answer: B**
**Detailed Explanation:**
- **DST Gap Adjustment:** When a local time falls in a Daylight Saving Time gap (Spring Forward), the time technically does not exist (clocks skip from 02:00 to 03:00).
- Java does not throw an exception here, but automatically adjusts the time. According to the Java specification for `ZonedDateTime.of`, the local time is moved forward by the gap length (typically 1 hour), using the new offset.
- Therefore, `02:30` (which is inside the gap) is adjusted to `03:30` with the summer offset `+02:00`.

---

### Question 3
Consider the DST fall-back transition in the `Europe/Berlin` zone. On October 25, 2026, clocks repeat the hour from 02:00 to 03:00 (moving back to 02:00 at 03:00).
What is the output of the following code?
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
- D. Throws an `AmbiguousTimeException`.

**Answer: A**
**Detailed Explanation:**
- **DST Overlap Adjustment:** During the fall-back transition (Overlap), the hour between 02:00 and 03:00 occurs twice—once before the transition (with summer offset `+02:00`) and once after (with winter offset `+01:00`).
- By default, `ZonedDateTime.of` handles this ambiguity by using the **earlier** offset, which was valid before the transition (`+02:00`).
- Therefore, `2:30` is created with the offset `+02:00`.

---

### Question 4
What is the outcome of running the following code block?
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

**Answer: B**
**Detailed Explanation:**
- **Temporal Unit Compatibility:** 
  - A `Duration` is based on time-based units (seconds, nanoseconds). However, `LocalDate` only stores date values (years, months, days) and does not support time-based operations. Thus, `date.plus(d)` throws an `UnsupportedTemporalTypeException` ("Err1").
  - A `Period` is based on date-based units (years, months, days). However, `LocalTime` only stores time and does not support date-based operations. Thus, `time.plus(p)` also throws an `UnsupportedTemporalTypeException` ("Err2").
  - `LocalDateTime` contains both date and time information and can therefore be modified by both `Duration` and `Period`. `dateTime.plus(d)` and `dateTime.plus(p)` both evaluate to May 11, 2026.

---

### Question 5
What is the result of compiling and running the following class?
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
- B. Compilation fails.
- C. Throws `UnsupportedTemporalTypeException` at runtime.
- D. Throws `ArithmeticException` at runtime.

**Answer: C**
**Detailed Explanation:**
- The `ChronoUnit.HOURS.between(Temporal, Temporal)` method queries the hour unit on the passed temporal objects.
- Since `LocalDate` does not support the hour unit (it only knows date components), the method throws an `UnsupportedTemporalTypeException` at runtime.
- To calculate the difference in hours, the objects must first be converted to a type that supports hours (like `LocalDateTime` or `ZonedDateTime`).

---

### Question 6
Which of the following statements correctly converts a `LocalDateTime` named `ldt` to an `Instant` representing the same point in UTC? (Choose all that apply)
- A. `Instant instant = ldt.toInstant();`
- B. `Instant instant = ldt.toInstant(ZoneOffset.UTC);`
- C. `Instant instant = ldt.atZone(ZoneId.of("UTC")).toInstant();`
- D. `Instant instant = Instant.from(ldt);`

**Answer: B, C**
**Detailed Explanation:**
- **Option A fails to compile:** `LocalDateTime` does not have a no-argument `toInstant()` method because it lacks zone/offset information and cannot map directly to a unique physical moment in time (Instant).
- **Option B is correct:** `LocalDateTime.toInstant(ZoneOffset offset)` converts directly to an `Instant` using the provided offset.
- **Option C is correct:** `atZone(ZoneId)` converts `LocalDateTime` to `ZonedDateTime`, which has a `toInstant()` method.
- **Option D throws DateTimeException at runtime:** `Instant.from(TemporalAccessor)` requires an object containing zone or offset information. Since `LocalDateTime` lacks this, the call fails at runtime.

---

### Question 7
What is the output of the following code?
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

**Answer: C**
**Detailed Explanation:**
- **Instant supported units:** An `Instant` represents a point in time on the timeline and only supports time-based units up to `ChronoUnit.DAYS` (defined as exactly 86,400 seconds).
- `Duration.ofDays(1)` is represented internally as a seconds value (86,400 seconds) and can be added to an `Instant` without issue. Thus, `D_OK` is printed.
- `Period.ofDays(1)` is calendar-based (years, months, days) and depends on the calendar system. `Instant` does not support calendar calculations and throws an `UnsupportedTemporalTypeException` when adding a `Period`. Thus, `P_ERR` is printed.

---

### Question 8
Given the following modern Java code, what is the output?
```java
Locale loc1 = Locale.of("EN", "us");
Locale loc2 = new Locale.Builder().setLanguage("en").setRegion("US").build();
System.out.print(loc1.equals(loc2) + " " + loc1.getLanguage() + "_" + loc1.getCountry());
```
- A. `false EN_us`
- B. `true en_US`
- C. `false en_US`
- D. Compilation fails because `Locale.of` is not a valid factory method in Java 21.

**Answer: B**
**Detailed Explanation:**
- **Locale Normalization:** Since Java 19, the static factory method `Locale.of(...)` is recommended over the deprecated constructors.
- `Locale.of` automatically normalizes the arguments: language code to lowercase (`"EN"` -> `"en"`) and country/region code to uppercase (`"us"` -> `"US"`).
- Therefore, both `loc1` and `loc2` have the same normalized values (`en` and `US`), meaning `equals()` returns `true`, and the output is `en_US`.

---

### Question 9
Suppose you have the following resources in your classpath:
- `labels.properties` (`title=Base`)
- `labels_de.properties` (`title=Deutsch`)
- `labels_de_DE.properties` (`title=Berlin`)

If the JVM default locale is `Locale.US` (`en_US`), what is the output of running:
```java
ResourceBundle rb = ResourceBundle.getBundle("labels", Locale.of("de", "AT"));
System.out.println(rb.getString("title"));
```
- A. `Berlin`
- B. `Deutsch`
- C. `Base`
- D. Throws `MissingResourceException`.

**Answer: B**
**Detailed Explanation:**
- **ResourceBundle Fallback Chain:** The search for a resource bundle follows a cascade:
  1. `labels_de_AT` (requested language + country) -> Not found.
  2. `labels_de` (language only) -> Found!
- Since a matching language bundle (`labels_de.properties`) is found, the search stops and this bundle is loaded. The value of `title` is defined as `"Deutsch"`.
- The default locale `en_US` is never checked because the search succeeded at step 2.

---

### Question 10
Consider the following resource bundles in the classpath:
- `labels.properties`
  ```properties
  hello=Hello
  goodbye=Goodbye
  ```
- `labels_de.properties`
  ```properties
  hello=Hallo
  ```

What is the output of the following code?
```java
ResourceBundle rb = ResourceBundle.getBundle("labels", Locale.GERMAN);
System.out.print(rb.getString("hello") + " " + rb.getString("goodbye"));
```
- A. `Hallo null`
- B. `Hallo Goodbye`
- C. Throws `MissingResourceException` because `goodbye` is missing in `labels_de`.
- D. `Hallo Hello`

**Answer: B**
**Detailed Explanation:**
- **Parent-Child Bundle Inheritance:** When a resource bundle is loaded, Java establishes a parent-child inheritance hierarchy between more specific bundles and the base bundle.
- `labels_de` is the child bundle, and `labels` is the parent.
- When calling `rb.getString("goodbye")`, Java first searches the child bundle `labels_de`. Since the key is missing there, it delegates the lookup to the parent bundle `labels`, where the key `"goodbye"` has the value `"Goodbye"`.
- The key `"hello"` is found in the child bundle and returns `"Hallo"`. The output is `Hallo Goodbye`.

---

### Question 11
What is the behavior of the following code segment?
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

**Answer: C**
**Detailed Explanation:**
- **Format Type Mismatch:** The `DateTimeFormatter` pattern requires hour (`HH`) and minute (`mm`) fields.
- The passed `date` object is a `LocalDate` and has no time components.
- When the formatter tries to extract the hours and minutes from the `LocalDate` object, it fails and throws an `UnsupportedTemporalTypeException`.

---

### Question 12
What is the output of the following code?
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

**Answer: B**
**Detailed Explanation:**
- **NumberFormat.parse Parsing Behavior:**
  - The `parse()` method analyzes the string from left to right. As soon as it encounters a character that cannot be parsed as a number, it stops and returns the number parsed up to that point.
  - For `"123.456xyz"`, the `"123.456"` portion is successfully parsed, and the trailing `"xyz"` is ignored. The result is `123.456`.
  - For `"xyz123.456"`, the string begins with invalid characters. Because parsing fails at the very start, the method throws a checked `ParseException`.
  - The catch block executes, printing `"Exception"`.

---

### Question 13
What is the output of the following code?
```java
NumberFormat shortFmt = NumberFormat.getCompactNumberInstance(Locale.US, NumberFormat.Style.SHORT);
NumberFormat longFmt = NumberFormat.getCompactNumberInstance(Locale.US, NumberFormat.Style.LONG);
System.out.println(shortFmt.format(1500000) + " " + longFmt.format(1500000));
```
- A. `1.5M 1.5 million`
- B. `1.5M 1.5 Million`
- C. `1500K 1.5 million`
- D. `1.5M 1 million`

**Answer: A**
**Detailed Explanation:**
- **CompactNumberFormat:** Introduced to format numbers in a compact style (e.g. for dashboards).
- For `1,500,000` (1.5 million) in `Locale.US`:
  - `Style.SHORT` formats it as `1.5M`.
  - `Style.LONG` formats it as `1.5 million` (lowercase "m" in standard US localization).

---

### Question 14
Which of the following code statements will throw an exception at runtime? (Choose all that apply)
- A. `LocalTime.of(24, 0);`
- B. `LocalDate.of(2026, 2, 29);`
- C. `LocalTime.of(23, 59, 59, 1_000_000_000);`
- D. `LocalDateTime.of(2026, 6, 31, 12, 0);`

**Answer: A, B, C, D**
**Detailed Explanation:**
- **Option A throws DateTimeException:** Hours must be in the range `0` to `23`. `24` is invalid.
- **Option B throws DateTimeException:** The year `2026` is not a leap year, so February has only 28 days. Feb 29, 2026 does not exist.
- **Option C throws DateTimeException:** Nanoseconds must be in the range `0` to `999,999,999`. `1,000,000,000` is invalid.
- **Option D throws DateTimeException:** June has only 30 days. June 31 does not exist.

---

### Question 15
What is the outcome of running the following code?
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

**Answer: C**
**Detailed Explanation:**
- `DateTimeFormatter.ofLocalizedDateTime(FormatStyle)` creates a formatter that requires both date and time information.
- The passed object `date` is a `LocalDate` (no time components).
- Formatting fails with a `DateTimeException` because the required time fields are missing. Note: Unlike patterns where field access failures throw `UnsupportedTemporalTypeException`, the localization pipeline throws a `DateTimeException` when the object lacks the required temporal fields.

---

### Question 16
What is the output of the following program?
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

**Answer: B**
**Detailed Explanation:**
- **ChronoUnit.between Conversions:**
  - The `between(Temporal, Temporal)` method converts the second argument to the type of the first argument.
  - In the first block (`ChronoUnit.DAYS.between(date, dateTime)`), the first argument is `LocalDate`. The second (`LocalDateTime`) is converted to `LocalDate` (truncating time), resulting in `2026-06-15`. The difference is `3` days.
  - In the second block (`ChronoUnit.DAYS.between(dateTime, date)`), the first argument is `LocalDateTime`. The second (`LocalDate`) must be converted to `LocalDateTime`. This fails because `LocalDate` lacks time information, raising a `DateTimeException` (or `UnsupportedTemporalTypeException`), resulting in `"E2"`.

---

### Question 17
What is the output of the following code?
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

**Answer: A**
**Detailed Explanation:**
- **DecimalFormat Symbols:**
  - The symbol `0` represents a required digit. If no digit exists at that position, `0` is printed (padding). `"0000.00"` formats `123.456` to two decimal places (rounded to `.46`) and pads the integer part to 4 digits: `0123.46`.
  - The symbol `#` represents an optional digit, printing nothing if no digit exists. `"####.####"` formats `123.456` without leading or trailing zeros.

---

### Question 18
Given the following declarations:
```java
ZoneId zone1 = ZoneId.of("+02:00");
ZoneId zone2 = ZoneOffset.ofHours(2);
ZoneId zone3 = ZoneId.of("Europe/Berlin");
```
Which of the following evaluations are true? (Choose all that apply)
- A. `zone1.equals(zone2)` evaluates to `true`.
- B. `zone2.equals(zone3)` evaluates to `true`.
- C. `zone3.rules().isFixedOffset()` evaluates to `false`.
- D. `zone1 instanceof ZoneOffset` evaluates to `true`.

**Answer: A, C, D**
**Detailed Explanation:**
- **ZoneId vs ZoneOffset:** 
  - `ZoneOffset` is a subclass of `ZoneId` representing a fixed offset without DST rules.
  - `ZoneId.of("+02:00")` returns a `ZoneOffset` instance. Thus, Option D is true.
  - `ZoneOffset.ofHours(2)` creates the same representation (`+02:00`). Thus, `zone1` and `zone2` are equal (Option A is true).
  - `ZoneId.of("Europe/Berlin")` represents a geographical time zone with dynamic transitions (Daylight Saving Time). It is not equal to a fixed offset `+02:00` (Option B is false) and its offset is not fixed (Option C is true).

---

### Question 19
What does the following code print?
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
- D. Compilation fails because `normalized()` is only available on `Duration`.

**Answer: B**
**Detailed Explanation:**
- **Period Normalization:** The `normalized()` method on `Period` only normalizes years and months (since 1 year is always 12 months).
- `15` months is normalized to `1` year and `3` months.
- Days cannot be converted to months because the number of days per month varies. Thus, `Period.ofDays(45)` remains unchanged as `0` months and `45` days.

---

### Question 20
What is the output of the following program?
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
- D. Compilation fails.

**Answer: B**
**Detailed Explanation:**
- **Locale Filtering:** The `Locale.filter` method filters a list of locales using a list of language ranges.
- The range `"en-US"` matches `en_US` exactly.
- The general range `"en"` (with weight `q=0.8`) matches all English locales, meaning both `en_US` and `en_GB`.
- The German locale `de_DE` is filtered out.
- Therefore, the result list contains both English locales (`[en_US, en_GB]`).
