# Chapter 8: Modern OOP - Sealed Classes, Records & Pattern Matching

## 1. Core Java 21 Exam Objectives
- Implement Sealed Classes and Interfaces, understanding constraints on subclasses.
- Write modern data carriers using Java Records.
- Write canonical, compact, and overloaded constructors in Records.
- Apply Type Pattern Matching with `instanceof` and `switch` expressions.
- Master Record Patterns for automatic record deconstruction.

---

## 2. Deep-Dive Concepts

### Sealed Classes and Interfaces
Sealed classes allow developers to control which classes can extend or implement them. This is declared using the `sealed` and `permits` keywords.

#### Strict Compiler Rules for Sealed Classes:
1. **Permits Clause:** A sealed class must list its allowed subclasses using `permits`. If subclasses are defined in the same source file, the `permits` clause can be omitted, and the compiler will auto-detect them.
2. **Subclass Declarations:** Every subclass that extends a sealed class must explicitly declare exactly one of these three modifiers:
   - **`final`:** The subclass cannot be extended further (closes the hierarchy).
   - **`sealed`:** The subclass is also sealed and must define its own permitted subclasses.
   - **`non-sealed`:** The subclass is opened up for any class to inherit from (breaks the sealing constraint).
3. **Same Module/Package:** Permitted subclasses must belong to the same package (or same module if using JPMS) as the sealed class.

### Java Records (Zero Boilerplate Data Carriers)
A **Record** is a special immutable class type designed solely to hold data. By declaring a record, the compiler automatically generates:
- `private final` fields for all record components.
- A public constructor (called the **Canonical Constructor**).
- Public accessor methods matching the component names (e.g., `id()` instead of `getId()`).
- `toString()`, `equals()`, and `hashCode()` implementations based on all fields.

#### Record Constructors:
- **Canonical Constructor:** Automatically generated, but can be written explicitly to validate or normalize data.
- **Compact Constructor:** A special shorthand syntax unique to records. It has **no parameters** and no parentheses. It runs *before* fields are assigned and is ideal for validation.
  ```java
  public record Book(String title, double price) {
      public Book { // Compact Constructor (no params!)
          if (price < 0.0) throw new IllegalArgumentException("Price cannot be negative");
          // Assignments (this.title = title) are done automatically at the end of this block!
      }
  }
  ```
- **Overloaded Constructors:** Must delegate to the canonical constructor using `this(...)` on their first line.

---

## 3. JVM Internals & Memory Layout

### Record Compiled Structure
At the bytecode level, a record is a normal class that inherits directly from `java.lang.Record`. Because Java does not support multiple class inheritance, **records cannot extend any other class**. They can, however, implement interfaces.
Records are implicitly `final` and cannot be declared `abstract`.

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

### Record Patterns (Java 21 Deconstruction)
Java 21 introduces **Record Patterns** (also known as record destructuring). Instead of matching a record and then calling its accessor methods, a record pattern extracts the individual components directly in the conditional statement.

```java
public void printCustomer(Object obj) {
    // Record Pattern Match destructures the record components automatically!
    if (obj instanceof Customer(String name, String email, int points)) {
        System.out.println("Customer Name: " + name + ", Points: " + points);
    }
}
```

---

## 4. Tricky OCP Exam Questions

### Question 1: Sealed Class Subclass Modifier Constraints
Which of the permitted subclasses in the following sealed class declaration will fail to compile?
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
- A. Circle only
- B. Square only
- C. Triangle only
- D. Hexagon only

**Answer: D**
**Detailed Explanation:**
- According to Java Sealed Classes rules, every permitted subclass of a sealed class must explicitly declare exactly one of three subclass modifiers to specify how the inheritance hierarchy is managed:
  - **`final`:** Closes the hierarchy (the subclass cannot be extended further). Circle is valid.
  - **`sealed`:** Continues the sealed hierarchy. It must declare its own permitted subclasses. Square is valid because it permits `ColoredSquare`.
  - **`non-sealed`:** Opens the hierarchy. Any class can extend `Triangle`. Triangle is valid.
- **Hexagon (Subclass D)** fails to compile because it does not declare any of the three required modifiers (`final`, `sealed`, or `non-sealed`).
- Therefore, Hexagon is invalid and causes a compile-time error.

---

### Question 2: Sealed Classes Package/Module constraints
Consider the following file structure and declarations:
`package com.geometry;`
`public sealed class Shape permits com.shapes.Circle {}`

`package com.shapes;`
`public final class Circle extends com.geometry.Shape {}`
Assuming this is NOT a modular Java application (no `module-info.java`), what is the compilation result?
- A. Compiles successfully.
- B. Fails to compile because permitted subclasses must reside in the same package as the sealed class.
- C. Fails to compile because `Circle` must use package-private access.
- D. Fails to compile because `com.shapes.Circle` is not imported.

**Answer: B**
**Detailed Explanation:**
- In a non-modular Java application, all permitted subclasses of a `sealed` class **must reside in the exact same package** as the sealed class.
- Since `Shape` is in `com.geometry` and `Circle` is in `com.shapes`, this violates the package constraint.
- The compiler rejects the code with an error.
- *(Note: If this were a modular application using the Java Platform Module System, the permitted subclasses could reside in different packages, but they would still be required to reside in the same **module**)*.

---

### Question 3: Compact Constructor Field Assignment Trap
What is the compilation result of the following Java Record declaration?
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
- A. Compiles successfully.
- B. Fails to compile at Line 6.
- C. Compiles but throws a RuntimeException.
- D. Fails to compile because compact constructors cannot contain validation logic.

**Answer: B**
**Detailed Explanation:**
- A **Compact Constructor** in a Record has no parameters and no parentheses.
- Its main purpose is to validate or normalize parameters before they are assigned to the record's final instance fields.
- Inside a compact constructor, the parameters are implicitly available, but **explicit assignment to the instance fields (using `this.field = ...`) is strictly prohibited**.
- The compiler automatically appends field assignments (`this.name = name; this.score = score;`) at the very end of the compact constructor block.
- Because Line 6 attempts to manually assign `this.score = score;`, the compiler throws an error: `cannot assign a value to final variable score` (or equivalent indicating that field assignments are illegal inside compact constructors).
- To fix this, simply remove Line 6. The normalization or validation updates the parameters, which are then assigned automatically.

---

### Question 4: Record Overloaded Constructor Rules
Given the record definition:
```java
public record Point(int x, int y) {
    public Point(int val) {
        // Line 3
    }
}
```
Which of the following lines must be inserted at Line 3 to make the record compile successfully?
- A. `this.x = val; this.y = val;`
- B. `x = val; y = val;`
- C. `this(val, val);`
- D. No code is required; the compiler handles default assignment.

**Answer: C**
**Detailed Explanation:**
- A record automatically generates a **Canonical Constructor** matching its components: `public Point(int x, int y)`.
- If you declare an **overloaded constructor** (a constructor with a different parameter list) in a record:
  - The overloaded constructor **must delegate to the canonical constructor (or another overloaded constructor) on its very first line**.
  - This delegation must be done using `this(...)`.
- **A and B are incorrect:** You cannot assign values directly to record final fields in an overloaded constructor.
- **C is correct:** `this(val, val);` delegates cleanly to the canonical constructor.

---

### Question 5: Record Field Declaration Limits
Which of the following field declarations is allowed inside the body of a Java Record?
```java
public record Account(String id) {
    private final double balance = 0.0;        // Option A
    public static String bankName = "MyBank";   // Option B
    private int score;                         // Option C
    private static final int LIMIT = 100;      // Option D
}
```
- A. Option A and C
- B. Option B and D
- C. Option A, B, and D
- D. None of the options are allowed.

**Answer: B**
**Detailed Explanation:**
- A record is designed strictly to be a simple data carrier. Its state is defined exclusively by the components declared in its header (e.g. `String id`).
- Therefore, records are **prohibited from declaring any additional instance variables (fields)**.
  - **Option A and C are invalid:** They attempt to declare instance fields (`balance`, `score`), causing compile-time errors.
- However, records **are allowed to declare static variables** (both constants and mutable static variables).
  - **Option B and D are valid:** They declare static fields (`bankName`, `LIMIT`), which compiles successfully.

---

### Question 6: Record Inheritance Rules
Which of the following record declarations compiles successfully?
- A. `public record ChildRecord(String name) extends ParentClass {}`
- B. `public record ChildRecord(String name) implements Serializable {}`
- C. `public abstract record ChildRecord(String name) {}`
- D. `public record ChildRecord(String name) extends Record {}`

**Answer: B**
**Detailed Explanation:**
- **A is incorrect:** Records implicitly inherit from `java.lang.Record`. Since Java does not support multiple class inheritance, a record **cannot extend any other class**.
- **B is correct:** While records cannot extend other classes, they **can implement any number of interfaces** (e.g. `implements Serializable`, `Runnable`, etc.).
- **C is incorrect:** Records are implicitly **`final`** because their state configuration is immutable. They cannot be declared `abstract`.
- **D is incorrect:** Even though records inherit from `java.lang.Record` under the hood, you cannot use `extends Record` explicitly in the syntax.

---

### Question 7: Instanceof Pattern Matching Scope
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
If Line 5 is uncommented, what is the result?
- A. The code compiles and runs successfully.
- B. Fails to compile because `s` is out of scope at Line 5.
- C. Fails to compile because `&&` cannot be used with pattern matching.
- D. Throws a NullPointerException at runtime.

**Answer: B**
**Detailed Explanation:**
- Java uses **flow scoping** for pattern matching variables (like `s`).
- The pattern variable `s` is only in scope in regions of the code where the compiler can guarantee that the `instanceof` check evaluated to `true`.
- In the expression `obj instanceof String s && s.length() > 5`:
  - If `obj instanceof String s` is `false`, the right-hand side is skipped (short-circuit). If it is `true`, `s` is in scope for `s.length()`.
  - In the `if` body, `s` is in scope because the condition was true.
  - In the `else` branch, the condition was `false`. This means either `obj` was not a `String`, or its length was not > 5. Since the compiler cannot guarantee that `obj` is a `String`, `s` is **out of scope** in the `else` block.
- Uncommenting Line 5 causes a compile-time error: `cannot find symbol: variable s`.

---

### Question 8: Pattern Matching Instanceof Scoping OR Trap
Which of the following conditional patterns will fail to compile?
- A. `if (obj instanceof String s && s.length() > 0)`
- B. `if (!(obj instanceof String s) || s.length() > 0)`
- C. `if (obj instanceof String s) { System.out.println(s); }`
- D. `if (!(obj instanceof String s)) { return; } else { System.out.println(s); }`

**Answer: B**
**Detailed Explanation:**
- **A compiles:** `&&` short-circuits. If the left side is true, `s` is initialized, making `s.length()` valid on the right side.
- **B fails to compile:** The logical OR operator `||` is used. If the left side `!(obj instanceof String s)` is `false` (meaning `obj` *is* a String), the right side `s.length()` must be evaluated.
- However, if the left side evaluates to `true` (meaning `obj` is *not* a String), the right side is skipped, but the compiler must verify scoping compile-time rules statically. Since `s` would not be initialized if `obj` was not a String, the compiler declares `s` out of scope for the OR expression, causing a compilation error.
- **C compiles:** Standard block scope.
- **D compiles:** If `obj` is not a String, the method returns. In the `else` block, `obj` is guaranteed to be a String, so `s` is in scope.

---

### Question 9: Switch Pattern Matching Domination (Reachable Cases)
Consider the following Java 21 switch statement:
```java
public void process(Object obj) {
    switch (obj) {
        case CharSequence cs -> System.out.print("CS ");
        case String s -> System.out.print("String ");
        default -> System.out.print("Other ");
    }
}
```
What is the compilation result of this code?
- A. Compiles successfully.
- B. Fails to compile because `CharSequence` is an interface and cannot be matched.
- C. Fails to compile because the `String` case is dominated by the `CharSequence` case.
- D. Throws a ClassCastException at runtime if a String is passed.

**Answer: C**
**Detailed Explanation:**
- The compiler checks the ordering of patterns in a `switch` statement to prevent unreachable code.
- Since `String` implements `CharSequence`, any object that matches `case String s` would have already matched the preceding `case CharSequence cs` branch.
- Therefore, the case `case String s` can never be reached. This is called **pattern domination**.
- The compiler flags this as an error: `this case label is dominated by a preceding case label`.
- To fix this, the more specific subclass case (`String`) must be placed **before** the more general parent class case (`CharSequence`).

---

### Question 10: Guard Patterns (the `when` keyword)
Given the following switch expression in Java 21:
```java
public static String evaluate(Object obj) {
    return switch (obj) {
        case String s when s.length() > 5 -> "Long String";
        case String s -> "Short String";
        default -> "Other";
    };
}
```
Does this code compile, and if so, what does `evaluate("Java21")` return?
- A. Fails to compile because `when` is not a keyword.
- B. Compiles successfully and returns `"Long String"`.
- C. Compiles successfully and returns `"Short String"`.
- D. Fails to compile because both cases match `String`.

**Answer: B**
**Detailed Explanation:**
- Java 21 supports **Guard Patterns** using the **`when`** contextual keyword.
- Guard patterns allow adding a boolean expression to a pattern case (e.g. `case String s when s.length() > 5`).
- The pattern matches only if the type check succeeds **and** the boolean expression evaluates to `true`.
- In this code, `"Java21"` is a `String` of length 6.
- The first case checks if length > 5, which is `true`. The expression returns `"Long String"`.
- The code compiles cleanly. Note that placing `case String s` *before* `case String s when s.length() > 5` would cause a domination compilation error because the unguarded case would catch all Strings.

---

### Question 11: Switch Patterns and Exhaustiveness
Consider the following sealed interface and switch expression:
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
Which of the following is true about the switch expression?
- A. Fails to compile because it is missing a `default` case.
- B. Fails to compile because `switch` expressions cannot match interfaces.
- C. Compiles successfully because the switch is exhaustive for the sealed interface `Device`.
- D. Throws a runtime exception if a new device class is added.

**Answer: C**
**Detailed Explanation:**
- A `switch` expression must be **exhaustive** (must cover all possible input values).
- When the selector expression is a **sealed type** (like `Device`), the compiler knows that the only possible implementations are `Phone` and `Laptop`.
- Since both permitted subclasses are covered in the `case` blocks, the compiler confirms that the switch is exhaustive.
- A `default` case is **not required** in this scenario. The code compiles successfully.
- *(Note: If `Device` were a normal, non-sealed interface, the compiler would reject the code because other classes could implement `Device`, requiring a `default` case).*

---

### Question 12: Record Pattern Deconstruction Syntax
Given the record:
`public record Point(int x, int y) {}`
Which of the following `instanceof` patterns correctly deconstructs the record? (Select all that apply)
- A. `if (obj instanceof Point(int x, int y))`
- B. `if (obj instanceof Point(var x, var y))`
- C. `if (obj instanceof Point(double x, double y))`
- D. `if (obj instanceof Point)`

**Answer: A, B, D**
**Detailed Explanation:**
- **A is correct:** Uses explicit types matching the record components (`int x`, `int y`).
- **B is correct:** Uses `var` type inference. The compiler infers `var x` as `int` and `var y` as `int`.
- **C is incorrect:** The deconstructed types must be assignment-compatible with the record components. You cannot deconstruct an `int` component directly into a `double` pattern parameter.
- **D is correct:** This is a standard Type Pattern match (not deconstructing), which is also valid.

---

### Question 13: Nested Record Patterns (Java 21)
Given the following record declarations:
```java
public record Point(int x, int y) {}
public record Rectangle(Point topLeft, Point bottomRight) {}
```
Which of the following matches is a valid **nested Record Pattern** to extract the coordinate `x` of the top-left point of a `Rectangle` object?
- A. `if (obj instanceof Rectangle(Point(int x, int y), Point br))`
- B. `if (obj instanceof Rectangle(Point topLeft(int x, int y), Point bottomRight))`
- C. `if (obj instanceof Rectangle(Point(int x), Point(int y)))`
- D. `if (obj instanceof Rectangle(int x1, int y1, int x2, int y2))`

**Answer: A**
**Detailed Explanation:**
- Java 21 supports nesting record patterns within other record patterns.
- `Rectangle` has components `Point topLeft` and `Point bottomRight`.
- **A is correct:** It deconstructs `topLeft` into a nested pattern `Point(int x, int y)` and matches the second component `bottomRight` as a standard type pattern `Point br`. The variable `x` extracts the top-left x-coordinate.
- **B is incorrect:** You cannot mix parameter name declarations with nested patterns inside the parentheses in this syntax.
- **C is incorrect:** `Point` has two components, so the nested `Point` pattern must declare two arguments (`Point(int x, int y)`), not one.
- **D is incorrect:** You must match the record structures; you cannot flatten the components.

---

### Question 14: Record Accessors Syntax
Given the record instance:
`Student s = new Student("Alice", 95);`
How do you access the `name` component value of `s`?
- A. `s.getName()`
- B. `s.name`
- C. `s.name()`
- D. `s.get("name")`

**Answer: C**
**Detailed Explanation:**
- The compiler automatically generates public accessor methods for record components.
- Unlike traditional JavaBeans which use get-prefixes (like `getName()`), record accessors have the **exact same name as the component** (`name()`).
- Therefore, C is correct.

---

### Question 15: Records and Static Fields initialization
What is the output of the following record application?
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
- C. Fails to compile because records cannot contain static variables.
- D. Fails to compile because records cannot declare main methods.

**Answer: B**
**Detailed Explanation:**
- Records can define static variables, static blocks, static methods, and a `main` entry point.
- The compact constructor increments the static variable `count` every time an instance of `Counter` is created.
- Two instances are created, incrementing `count` to `2`.
- Output: `2`.

---

### Question 16: Records fields immutability
What is the result of compiling the following record code?
```java
public record Mutator(StringBuilder data) {
    public void change() {
        data.append("Modified");
    }
}
```
- A. Fails to compile because records are immutable and their fields cannot be altered.
- B. Compiles successfully, showing that while references inside a record are final, the objects they point to can still be modified (shallow immutability).
- C. Fails to compile because records cannot declare custom instance methods.
- D. Throws a runtime Exception.

**Answer: B**
**Detailed Explanation:**
- Record components are declared as `private final` fields.
- This enforces **reference immutability**: the field `data` cannot be reassigned to point to another `StringBuilder` instance.
- However, the object referenced by `data` is a mutable `StringBuilder` instance. Calling `data.append(...)` mutates the internal state of that object.
- Therefore, records only guarantee **shallow immutability**.
- The code compiles and runs successfully.

---

### Question 17: Sealed Interfaces and Enum permitted subclasses
Can a Java `enum` implement a sealed interface?
```java
sealed interface Status permits Phase {}
enum Phase implements Status { START, RUNNING, END }
```
- A. No, `enum` types cannot implement interfaces.
- B. Yes, because `enum` types are implicitly final, satisfying the sealed subclass modifier constraint.
- C. No, only classes and interfaces can be permitted subclasses of sealed types.
- D. Yes, but only if the enum is declared `final enum`.

**Answer: B**
**Detailed Explanation:**
- Sealed interfaces can permit `enum` types.
- Under the hood, an `enum` is compiled as a class that inherits from `java.lang.Enum`.
- Since enums are implicitly final (or sealed if they contain constant-specific class bodies), they conform to the requirement that any permitted subclass of a sealed type must be `final`, `sealed`, or `non-sealed`.
- The code compiles successfully.

---

### Question 18: Record Patterns with Null references
What is the result of executing the following method in Java 21?
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
- A. Throws a `NullPointerException` at runtime.
- B. Prints `User: null`
- C. Prints `NoUser`
- D. Fails to compile.

**Answer: C**
**Detailed Explanation:**
- The `instanceof` operator evaluates to `false` if the reference being checked is `null`.
- This rule applies identically to both standard type patterns and **Record Patterns**.
- Since `obj` is `null`, `obj instanceof User(var name)` evaluates to `false`.
- The execution flows to the `else` block and prints `"NoUser"`. No exception is thrown.

---

### Question 19: Sealed Classes across compilation units (files)
If a sealed class permits subclasses that are defined in the **same source file**, which of the following is true?
- A. The `permits` clause is still mandatory.
- B. The `permits` clause is optional; the compiler automatically infers the permitted subclasses.
- C. The subclasses must be declared static.
- D. Subclasses must be declared inner classes.

**Answer: B**
**Detailed Explanation:**
- If all permitted subclasses are declared in the same source file (same compilation unit) as the sealed class:
  - The `permits` clause can be omitted.
  - The compiler automatically scans the file and infers the list of permitted subclasses.
- Therefore, B is correct.

---

### Question 20: Switch Pattern matching with null case
What does the following switch pattern match print when `null` is passed?
```java
public static void process(Object obj) {
    switch(obj) {
        case String s -> System.out.print("String ");
        case null -> System.out.print("Null ");
        default -> System.out.print("Default ");
    }
}
```
- A. Throws a `NullPointerException` before matching.
- B. Prints `Default `
- C. Prints `Null `
- D. Fails to compile because `null` cannot be used as a case label.

**Answer: C**
**Detailed Explanation:**
- Traditionally, passing `null` to a `switch` statement threw a `NullPointerException` immediately.
- In modern Java (Java 21), you can explicitly handle null values using a **`case null`** label.
- If `obj` is `null`, the execution matches `case null` and prints `"Null "`.
- If `case null` is omitted, passing `null` to a pattern-matching switch still throws a `NullPointerException` (unless the only pattern is a total type pattern or `default`, which does not check null directly in some contexts, but `case null` is the standard way to handle it).
- Output: `Null `.

