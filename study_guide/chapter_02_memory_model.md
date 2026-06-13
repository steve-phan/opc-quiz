# Chapter 2: Java Memory Model - Stack, Heap & Variables

## 1. Core Java 21 Exam Objectives
- Differentiate between Stack and Heap memory in the JVM.
- Declare, initialize, and use primitive variables and object references.
- Master wrapper classes, autoboxing, and unboxing.
- Apply Local Variable Type Inference (`var`) and understand its compiler rules.

---

## 2. Deep-Dive Concepts

### Stack vs. Heap Memory
Java manages memory using two main regions: Stack and Heap. Understanding where variables and objects are stored is critical for both the OCP exam and debugging memory leaks.

| Feature | Stack Memory | Heap Memory |
| :--- | :--- | :--- |
| **Purpose** | Stores local variables and method invocation frames. | Stores all objects and their instance variables. |
| **Lifecycle** | LIFO (Last-In, First-Out). Allocated when a method is called, freed when it returns. | Managed by the Garbage Collector (GC). Objects persist as long as they are reachable. |
| **Scope** | Private to the thread of execution. | Shared globally among all threads in the JVM. |
| **Error** | Throws `StackOverflowError` if stack space is depleted. | Throws `OutOfMemoryError` if heap space is depleted. |

```
+-----------------------------------------------------------+
| JVM MEMORY LAYOUT                                         |
|                                                           |
|  [ Thread Stack ]                     [ Global Heap ]     |
|  +--------------------+               +-----------------+ |
|  | main() Frame       |               |  Book Object    | |
|  |   - int price = 30 |               |  - title: "Java"| |
|  |   - Book ref  -------------------->|  - stock: 100   | |
|  +--------------------+               +-----------------+ |
|  | calculate() Frame  |                                   |
|  |   - double tax     |                                   |
|  +--------------------+                                   |
+-----------------------------------------------------------+
```

### Local Variable Type Inference (`var`)
Introduced in Java 10 and expanded in later versions, `var` allows local variables to infer their type based on the initialization value. It is compiled to the inferred type (no performance overhead).

#### Strict Compiler Rules for `var` (Highly Tested on OCP):
1. **Local Variables Only:** Can only be used inside methods (local variables, loops). Cannot be used for class fields, method parameters, or return types.
2. **Immediate Initialization:** Must be declared and initialized on the same line.
   - `var x = 10;` (Valid)
   - `var y; y = 20;` (Compile-time error)
3. **No Null Initialization:** Cannot initialize `var` to `null` directly, because the compiler cannot determine the intended type.
   - `var name = null;` (Compile-time error)
   - `var name = (String) null;` (Valid, but discouraged)
4. **No Compound Declarations:** Cannot use `var` in a comma-separated list.
   - `var a = 1, b = 2;` (Compile-time error)
5. **Var is Not a Keyword:** `var` is a reserved type name, not a reserved keyword. You can declare a variable or method named `var` (e.g. `int var = 5;`), though doing so is highly discouraged.

---

## 3. JVM Internals & Memory Layout

### Stack Frame Structure
Every thread in the JVM has its own execution stack. Each method execution allocates a **Stack Frame**. A Stack Frame contains:
1. **Local Variable Array (LVA):** An array storing local variables and method parameters. Primitives store their literal values directly in this array. References store a 32-bit or 64-bit memory address pointing to the object on the Heap.
2. **Operand Stack:** A workspace where bytecode instructions push and pop values to perform arithmetic or logical operations.
3. **Frame Data:** Metadata supporting method resolution, exception dispatch, and return values.

### Autoboxing & Unboxing Internals
Wrapper classes (e.g., `Integer`, `Double`, `Boolean`) wrap primitive values in an object structure on the Heap.
- **Autoboxing:** Compiler replaces primitives with a wrapper object. Under the hood, Java calls `Integer.valueOf(primitive)`.
- **Unboxing:** Compiler extracts the primitive value. Under the hood, Java calls `wrapper.intValue()`.

*OCP Trap:* Autoboxing utilizes caching for specific values. `Integer.valueOf(x)` caches values between `-128` and `127`. 
- `Integer a = 100; Integer b = 100; System.out.println(a == b);` prints `true` (references are identical due to cache).
- `Integer c = 200; Integer d = 200; System.out.println(c == d);` prints `false` (references are distinct because 200 is outside the cached range).

---

## 4. Tricky OCP Exam Questions

### Question 1: Stack vs. Heap Allocation
Consider the following program:
```java
public class AllocationTracker {
    private int id;
    private String name;
    
    public AllocationTracker(int id, String name) {
        this.id = id;
        this.name = name;
    }

    public static void main(String[] args) {
        int localId = 105;
        String localName = "Tracker";
        AllocationTracker tracker = new AllocationTracker(localId, localName);
    }
}
```
Which of the following statements accurately describes where these variables and objects are located in memory? (Select all that apply)
- A. The variable `localId` is stored directly on the Stack.
- B. The variable `tracker` (the reference) is stored on the Stack.
- C. The object `AllocationTracker` created by `new` is stored on the Heap.
- D. The instance field `id` of the `AllocationTracker` object is stored on the Stack.
- E. The string object `"Tracker"` is stored on the Heap.

**Answer: A, B, C, E**
**Detailed Explanation:**
- **A is correct:** `localId` is a local primitive variable inside the `main` method, so it is stored directly in the Local Variable Array (LVA) of the `main` method's stack frame.
- **B is correct:** `tracker` is a local reference variable. The reference itself (the 32-bit or 64-bit memory address pointer) is stored on the Stack.
- **C is correct:** All objects instantiated via the `new` keyword are allocated on the Heap.
- **D is incorrect:** Even though `id` is a primitive type (`int`), it is an *instance variable* (a member of the `AllocationTracker` class). Instance variables are stored inside the object structure itself, which resides on the Heap.
- **E is correct:** Strings (both literals and objects) reside on the Heap (specifically in the String Pool or Heap space).

---

### Question 2: Local Variable Type Inference (`var`) - Field Usage
Given the following class definition:
```java
public class FieldVar {
    private var limit = 100;
    public static var factor = 2.5;

    public void process(var input) {
        var result = input;
    }
}
```
Which lines in this code will cause a compile-time error?
- A. Only `private var limit = 100;`
- B. Only `public static var factor = 2.5;`
- C. Only `public void process(var input)`
- D. `private var limit = 100;`, `public static var factor = 2.5;`, and `public void process(var input)`
- E. The code compiles without errors.

**Answer: D**
**Detailed Explanation:**
- The local variable type inference keyword `var` is strictly limited to **local variables** inside methods, constructors, or loop blocks.
- It **cannot** be used for:
  - Instance fields (`private var limit`)
  - Static fields (`public static var factor`)
  - Method parameters (`var input`)
  - Method return types (e.g. `public var calculate() { return 5; }`)
- Therefore, all three declarations cause compile-time errors.

---

### Question 3: Invalid `var` Declarations
Which of the following local variable declarations using `var` will fail to compile? (Select all that apply)
- A. `var a = 1, b = 2;`
- B. `var name = (String) null;`
- C. `var list = new java.util.ArrayList<>();`
- D. `var matrix = { {1, 2}, {3, 4} };`
- E. `var path; path = "home";`

**Answer: A, D, E**
**Detailed Explanation:**
- **A is incorrect/fails to compile:** Compound declarations (comma-separated lists) are prohibited with `var`, even if all variables are initialized.
- **B is correct/compiles:** Declaring `var name = null;` fails, but if you cast the null reference to a specific type, like `(String) null`, the compiler can infer that the variable type is `String`.
- **C is correct/compiles:** This compiles, but because the diamond operator `<>` has no type parameter, the compiler infers `ArrayList<Object>`.
- **D is incorrect/fails to compile:** Array initializers without an explicit type (e.g., `{1, 2}`) are not allowed with `var`. To compile, you must write `var matrix = new int[][]{ {1, 2}, {3, 4} };`.
- **E is incorrect/fails to compile:** Variables declared with `var` must be initialized on the same line. Splitting the declaration and initialization causes a compile-time error.

---

### Question 4: NullPointerExceptions with Autoboxing and Unboxing
What is the result of attempting to compile and run the following code?
```java
public class BoxNull {
    public static void main(String[] args) {
        Integer val = null;
        int num = val;
        System.out.println(num);
    }
}
```
- A. Prints `null`
- B. Prints `0`
- C. Throws a `NullPointerException` at runtime.
- D. Fails to compile because `Integer` cannot be assigned to `int`.

**Answer: C**
**Detailed Explanation:**
- The code compiles without error. The compiler automatically translates `int num = val;` to `int num = val.intValue();` (unboxing).
- At runtime, since `val` is `null`, calling `val.intValue()` results in a `NullPointerException`.
- This is a very common trap on the OCP exam where null wrapper objects are unboxed implicitly.

---

### Question 5: Integer Cache Range and Equality
What does the following code print?
```java
public class CacheCompare {
    public static void main(String[] args) {
        Integer a = 127;
        Integer b = 127;
        Integer c = 128;
        Integer d = 128;
        
        System.out.print((a == b) + " " + (c == d) + " " + c.equals(d));
    }
}
```
- A. `true true true`
- B. `true false false`
- C. `true false true`
- D. `false false true`

**Answer: C**
**Detailed Explanation:**
- When assigning an `int` literal to an `Integer` wrapper, autoboxing occurs via `Integer.valueOf()`.
- Java caches `Integer` instances for values from `-128` to `127`.
- `a` and `b` fall within this range, so `a == b` compares the same cached object reference on the Heap, yielding `true`.
- `c` and `d` (value `128`) are outside the cache range, so separate `Integer` objects are created on the Heap. The reference comparison `c == d` yields `false`.
- The `.equals()` method compares the actual wrapped values, not reference memory addresses. Since both wrap `128`, `c.equals(d)` yields `true`.
- Combining these: `true false true`.

---

### Question 6: Garbage Collection Eligibility
At which point in the following method does the object originally referenced by `obj1` become eligible for garbage collection?
```java
public class GCTest {
    public void execute() {
        Object obj1 = new Object(); // Line 3
        Object obj2 = new Object(); // Line 4
        obj1 = obj2;                // Line 5
        obj2 = null;                // Line 6
        // Line 7
    }
}
```
- A. At Line 5
- B. At Line 6
- C. At Line 7 (when the method returns)
- D. It is not eligible for GC until the application terminates.

**Answer: A**
**Detailed Explanation:**
- An object is eligible for garbage collection when there are no active, reachable references pointing to it.
- **Line 3:** A new Object (let's call it Object-A) is created. `obj1` references Object-A.
- **Line 4:** Another Object (Object-B) is created. `obj2` references Object-B.
- **Line 5:** `obj1` is reassigned to point to the same object as `obj2` (Object-B). At this point, there are no references pointing to Object-A anymore. Object-A becomes eligible for garbage collection immediately at Line 5.
- **Line 6:** `obj2` is set to `null`, but Object-B is still reachable through `obj1`. So Object-B is not eligible for GC yet.

---

### Question 7: Var type inference in loops
Given the following method, which lines compile successfully? (Select all that apply)
```java
import java.util.List;
public class LoopVar {
    public void run() {
        var list = List.of("A", "B", "C"); // Line 4
        for (var item : list) {             // Line 5
            System.out.print(item);
        }
        for (var i = 0; i < 3; i++) {       // Line 8
            System.out.print(i);
        }
    }
}
```
- A. Only Line 4
- B. Lines 4 and 5 only
- C. Lines 4 and 8 only
- D. All lines (4, 5, and 8) compile successfully.

**Answer: D**
**Detailed Explanation:**
- `var` is perfectly valid inside loops:
  - **Line 4:** Infers type `List<String>`.
  - **Line 5:** Enhanced `for` loop variable type inference. Since `list` is a collection of Strings, the compiler infers `var item` to be of type `String`.
  - **Line 8:** Traditional `for` loop index initialization. The compiler infers `var i` to be of type `int`.
- All declarations conform to the local variable scope rule, so the class compiles cleanly.

---

### Question 8: Shadowing and Identifier Initialization
What is the result of executing the following class?
```java
public class ShadowTest {
    static int x = 10;
    
    public static void main(String[] args) {
        int x = x; 
        System.out.println(x);
    }
}
```
- A. Prints `10`
- B. Prints `0`
- C. Fails to compile because of a duplicate variable declaration.
- D. Fails to compile because `x` is used in its own initialization.

**Answer: D**
**Detailed Explanation:**
- In the line `int x = x;`, the local variable declaration `int x` shadows the static class field `x`.
- When the compiler parses `x = x`, it resolves the right-hand side `x` to the local variable `x` that is currently being declared, NOT the static class variable `ShadowTest.x`.
- Since local variables do not have default values and must be initialized before they are read, trying to assign local `x` to itself before it is initialized results in a compile-time error: `variable x might not have been initialized`.
- To avoid this, you would have to write `int x = ShadowTest.x;`.

---

### Question 9: Java Identifiers Naming Rules
Which of the following are valid Java identifiers that can be used to name variables? (Select all that apply)
- A. `$money`
- B. `_name`
- C. `9to5`
- D. `var`
- E. `_`
- F. `public`

**Answer: A, B, D**
**Detailed Explanation:**
- **A is correct:** Identifiers can begin with a letter, currency sign (`$`), or underscore (`_`).
- **B is correct:** Identifiers can begin with an underscore.
- **C is incorrect:** Identifiers cannot begin with a digit (must not start with `9`).
- **D is correct:** `var` is a *reserved type name*, not a keyword, meaning it can be used as a variable identifier (e.g., `int var = 5;` compiles, although it is considered extremely poor practice).
- **E is incorrect:** Since Java 9, the single underscore `_` is a reserved keyword and cannot be used as an identifier.
- **F is incorrect:** `public` is a reserved keyword and cannot be used as an identifier.

---

### Question 10: Implicit Narrowing and Primitive Assignments
Which of the following assignments will compile without requiring an explicit cast? (Select all that apply)
- A. `byte b = 127;`
- B. `byte b = 128;`
- C. `int val = 10; byte b = val;`
- D. `final int val = 10; byte b = val;`
- E. `char c = 65;`

**Answer: A, D, E**
**Detailed Explanation:**
- **A is correct:** `127` is a compile-time constant within the range of a `byte` (`-128` to `127`). Java applies implicit narrowing.
- **B is incorrect:** `128` is out of the `byte` range, so the compiler rejects it without an explicit cast (`(byte) 128`).
- **C is incorrect:** Even though the value `10` fits in a byte, `val` is a variable, not a compile-time constant. The compiler cannot guarantee that the value of `val` won't change at runtime, so it requires an explicit cast.
- **D is correct:** Since `val` is declared `final` and initialized to a constant expression (`10`), it is treated as a compile-time constant. Since `10` fits inside the byte range, implicit narrowing is allowed.
- **E is correct:** `65` is a constant expression fitting within the range of `char` (`0` to `65,535`), compiling without issues.

---

### Question 11: Floating-Point Wrapper Cache
What is the result of executing the following snippet?
```java
Double d1 = 1.0;
Double d2 = 1.0;
Float f1 = 2.0f;
Float f2 = 2.0f;
System.out.print((d1 == d2) + " " + (f1 == f2));
```
- A. `true true`
- B. `true false`
- C. `false false`
- D. `false true`

**Answer: C**
**Detailed Explanation:**
- Unlike `Integer`, `Byte`, `Short`, `Long`, and `Character`, the floating-point wrappers **`Double`** and **`Float`** do NOT implement caching for any range of values.
- Every autoboxing assignment of a floating-point literal (e.g. `Double d1 = 1.0;`) creates a completely new object on the Heap.
- Therefore, the reference comparisons `d1 == d2` and `f1 == f2` both return `false`.

---

### Question 12: Var with Lambda Expressions
Given the following code block, which variable initialization will compile successfully?
```java
// Option A
var x = () -> System.out.println("Hello");

// Option B
var y = (Runnable) () -> System.out.println("Hello");

// Option C
var z = System.out::println;
```
- A. Option A only
- B. Option B only
- C. Option C only
- D. None of the options compile.

**Answer: B**
**Detailed Explanation:**
- To compile a lambda expression or method reference, the compiler requires a **target type** (a functional interface class).
- `var` alone does not provide a target type, so `var x = () -> ...` and `var z = ...` fail because the compiler cannot infer which functional interface is being implemented.
- However, if you explicitly cast the lambda to a functional interface target type, like `(Runnable)`, the compiler can infer the type of `y` as `Runnable`. Thus, Option B compiles successfully.

---

### Question 13: Local Variable Initialization Rules
What is the result of running the following code?
```java
public class LocalInit {
    public static void main(String[] args) {
        int x;
        boolean check = false;
        if (check) {
            x = 10;
        } else {
            // empty
        }
        System.out.println(x);
    }
}
```
- A. Prints `0`
- B. Prints `10`
- C. Throws a `NullPointerException` at runtime.
- D. Fails to compile.

**Answer: D**
**Detailed Explanation:**
- Local variables must be explicitly initialized before they are read.
- The compiler performs a flow analysis to verify if every possible path initializes the variable.
- In this code, if `check` is `false`, the execution flows to the `else` branch, which does not initialize `x`.
- Since there is a path where `x` is not initialized before it is passed to `System.out.println(x)`, the compiler generates an error: `variable x might not have been initialized`.

---

### Question 14: Numeric Promotion Rules
What is the type of the resulting variable `result` in the following expression?
```java
byte a = 10;
short b = 20;
var result = a + b;
```
- A. `byte`
- B. `short`
- C. `int`
- D. `double`

**Answer: C**
**Detailed Explanation:**
- Java binary operators (like `+`) apply **numeric promotion** rules:
  - If any operand is a `double`, the other is promoted to `double`.
  - Otherwise, if any operand is a `float`, the other is promoted to `float`.
  - Otherwise, if any operand is a `long`, the other is promoted to `long`.
  - Otherwise, **both** operands are promoted to `int` (even if neither is an `int`).
- Since `a` is a `byte` and `b` is a `short`, both are promoted to `int` before addition. The result is of type `int`. Using `var` resolves the variable type of `result` to `int`.

---

### Question 15: Character and Integer cache behavior
What is the output of running the following statements?
```java
Character c1 = 'A';
Character c2 = 'A';
Character c3 = '\u00ff';
Character c4 = '\u00ff';
System.out.print((c1 == c2) + " " + (c3 == c4));
```
- A. `true true`
- B. `true false`
- C. `false false`
- D. `false true`

**Answer: B**
**Detailed Explanation:**
- The `Character` wrapper class caches instances for character values in the ASCII range, specifically from `\u0000` to `\u007f` (value `0` to `127`).
- `'A'` has an integer value of `65`, which is within the cache range, so `c1 == c2` evaluates to `true`.
- `\u00ff` has an integer value of `255`, which is outside the cached range (`127`), so new instances are created. The comparison `c3 == c4` evaluates to `false`.

---

### Question 16: Compound Assignment Operators and Implicit Casting
Consider the following statements:
```java
int x = 5;
long y = 10;
x = x + y;  // Line 3
x += y;     // Line 4
```
Which of the following is true?
- A. Both Line 3 and Line 4 compile successfully.
- B. Line 3 fails to compile, but Line 4 compiles successfully.
- C. Line 3 compiles successfully, but Line 4 fails to compile.
- D. Both lines fail to compile.

**Answer: B**
**Detailed Explanation:**
- **Line 3 (fails to compile):** The expression `x + y` promotes `x` to a `long` and performs addition. The result is of type `long`. You cannot assign a `long` to an `int` variable without an explicit cast.
- **Line 4 (compiles):** Compound assignment operators (like `+=`, `-=`, `*=`, `/=`) contain an **implicit cast** built-in. The expression `x += y` is equivalent to `x = (int) (x + y)`. Therefore, it compiles without errors.

---

### Question 17: Local Variable Type Inference in Generic Declarations
Which type is inferred by the compiler for the variable `list` in the following declaration?
```java
var list = new java.util.ArrayList<>();
```
- A. `ArrayList<Object>`
- B. `ArrayList<String>`
- C. `ArrayList<Void>`
- D. The code does not compile because the type parameter is empty.

**Answer: A**
**Detailed Explanation:**
- The code compiles successfully.
- When `var` is combined with the diamond operator `<>` without a type parameter specified on either side, the compiler cannot deduce a specific type, so it defaults the type parameter to `java.lang.Object`.
- Hence, the inferred type is `ArrayList<Object>`.

---

### Question 18: Primitive Underflow and Overflow
What does the following print?
```java
int val1 = Integer.MAX_VALUE;
int val2 = val1 + 1;
System.out.println(val2 < val1);
```
- A. `true`
- B. `false`
- C. Throws an `ArithmeticException` at runtime due to overflow.
- D. Fails to compile.

**Answer: A**
**Detailed Explanation:**
- In Java, primitive integer arithmetic does not throw exceptions on overflow or underflow. Instead, they silently wrap around.
- `Integer.MAX_VALUE` is `2,147,483,647`.
- Adding `1` to it results in overflow, wrapping around to the minimum negative value `Integer.MIN_VALUE` (`-2,147,483,648`).
- Since `-2,147,483,648` is less than `2,147,483,647`, the condition `val2 < val1` evaluates to `true`.

---

### Question 19: The finalize() Method Status
Which of the following statements is true regarding the `finalize()` method on objects in modern Java versions (such as Java 21)?
- A. It is guaranteed to be called immediately before an object's memory is reclaimed.
- B. It has been deprecated since Java 9 and was removed in Java 18, so calling it or overriding it causes a compile error.
- C. It is deprecated (since Java 9) and should not be used, but still exists in `java.lang.Object` for backward compatibility.
- D. Overriding `finalize()` is the recommended way to close resources in Java 21.

**Answer: C**
**Detailed Explanation:**
- Overriding `finalize()` has long been recognized as unpredictable, slow, and dangerous for resource management.
- It was deprecated in Java 9. Although there have been proposals to remove it, in Java 21 it still exists in `java.lang.Object` for backward compatibility, meaning overriding it compiles (with deprecation warnings).
- **AutoCloseable** and the **try-with-resources** statement are the standard and recommended mechanisms for managing resource cleanup.

---

### Question 20: Literal Suffixes and Types
What is the data type of the literal `0x7FFF_FFFF` and `2.0` respectively?
- A. `short` and `float`
- B. `int` and `double`
- C. `long` and `double`
- D. `int` and `float`

**Answer: B**
**Detailed Explanation:**
- Hexadecimal literals starting with `0x` without a suffix (like `L` or `l`) are treated as `int` (as long as they fit within the range). `0x7FFF_FFFF` is equivalent to `Integer.MAX_VALUE`, so its type is `int`.
- Floating-point literals without a suffix (like `f`, `F`, `d`, `D`) default to **`double`** in Java.
- Therefore, the types are `int` and `double` respectively.

