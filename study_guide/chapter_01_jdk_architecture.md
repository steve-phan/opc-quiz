# Chapter 1: JDK Architecture, Compilation & Execution

## 1. Core Java 21 Exam Objectives
- Understand Java components: JDK, JRE, and JVM.
- Describe the Java compilation and execution lifecycle.
- Identify correct signatures of the `main` method.
- Explain JVM class loading and class execution.

---

## 2. Deep-Dive Concepts

### JDK vs. JRE vs. JVM
Java's architecture is divided into three layers, each serving a specific phase of the development and execution lifecycle:
1. **JVM (Java Virtual Machine):** The core runtime engine. It is responsible for executing bytecode, managing memory (garbage collection), and interacting with the host operating system. The JVM is platform-dependent (there are distinct JVM builds for Windows, macOS, and Linux).
2. **JRE (Java Runtime Environment):** A packaging layer that contains the JVM plus the core libraries and resources required to *run* compiled Java programs. It does not contain development tools like compilers.
3. **JDK (Java Development Kit):** The complete software development bundle. It contains the JRE plus tools needed to compile, debug, and package Java programs, including:
   - `javac`: The Java Compiler.
   - `jar`: The archiving tool.
   - `jcmd`, `jdb`, `jconsole`: Diagnostic and debugging tools.

```
+--------------------------------------------------------+
| JDK (Java Development Kit)                             |
|   +--------------------------------------------------+ |
|   | JRE (Java Runtime Environment)                   | |
|   |   +-------------------+  +---------------------+ | |
|   |   | JVM               |  | Core Libraries &    | | |
|   |   | (Runtime Engine)  |  | Resources           | | |
|   |   +-------------------+  +---------------------+ | |
|   +--------------------------------------------------+ |
|   | Development Tools (javac, jar, jcmd, etc.)       | |
|+-------------------------------------------------------+
```

### The Compilation and Execution Lifecycle
Java utilizes a two-step translation process to achieve platform independence ("Write Once, Run Anywhere"):
1. **Compilation (Compile Time):** 
   - Source code (`.java` files) is parsed by the compiler (`javac`).
   - The compiler verifies syntax and compile-time type safety.
   - It outputs platform-independent **Bytecode** (`.class` files).
2. **Execution (Runtime):**
   - The JVM reads the bytecode (`.class` file).
   - The ClassLoader loads required classes.
   - The JVM **Interpreter** reads bytecode instructions sequentially and translates them to native machine code.
   - The **JIT (Just-In-Time) Compiler** identifies "hot spots" (frequently executed code blocks) and compiles them directly into native machine instructions to optimize performance.

---

## 3. JVM Internals & Memory Layout

### Class Loading Lifecycle
When a Java program starts, the JVM loads classes dynamically. This process consists of three main phases:
1. **Loading:** The JVM reads the binary representation of the class (the `.class` file) and creates a `java.lang.Class` object in the Metaspace.
2. **Linking:**
   - **Verification:** Checks the structural correctness of the bytecode to ensure it does not violate JVM security constraints.
   - **Preparation:** Allocates memory for static fields and initializes them to their default values (e.g., `0`, `0.0`, `false`, `null`). *Note: Custom initializers do not run yet.*
   - **Resolution:** Translates symbolic references in the constant pool into direct references (memory pointers) within the Metaspace.
3. **Initialization:** Executes static initialization blocks and static field initializers. This is when the class is fully initialized.

```
+-------------------------------------------------------+
| JVM CLASS LOADING LIFECYCLE                           |
|                                                       |
| 1. Loading       -->  Reads .class file into Metaspace|
| 2. Linking                                            |
|    - Verification -->  Checks bytecode correctness     |
|    - Preparation  -->  Allocates static memory        |
|                        (initializes to default values)|
|    - Resolution   -->  Resolves symbolic references   |
| 3. Initialization-->  Executes static initializers    |
+-------------------------------------------------------+
```

### The `main` Method Rules
For a class to act as an entry point, the JVM looks for a very specific method signature. To find it, the JVM looks for:
- **`public`**: Accessible from outside the class package (called by the JVM runtime).
- **`static`**: Executable without creating an instance of the class.
- **`void`**: Returns no value to the JVM.
- **`main`**: The exact lowercase name.
- **`String[] args`** or **`String... args`**: Array of String arguments (Varargs).

#### Valid Signatures:
- `public static void main(String[] args)`
- `public static void main(String... args)`
- `static public void main(String[] args)` (Access modifiers can be in any order, though `public static` is convention).
- `public static final void main(String[] args)` (`final` is allowed, though rarely used).

#### Invalid Signatures (Will compile, but JVM will throw `NoSuchMethodError` at runtime):
- `public void main(String[] args)` (Not static)
- `static void main(String[] args)` (Not public)
- `public static int main(String[] args)` (Returns `int` instead of `void`)
- `public static void main(String args)` (Parameter is `String`, not an array or vararg)
- `public static void Main(String[] args)` (Uppercase `M` in `Main`)

---

## 4. Tricky OCP Exam Questions

### Question 1: Platform Independence and JVM/JDK Components
Which of the following statements correctly describe the platform independence of Java and the distribution of tools across the JDK, JRE, and JVM? (Select all that apply)
- A. Java bytecode (.class) is platform-dependent because it must be generated specifically for either Windows, Linux, or macOS.
- B. The JVM is platform-dependent; a different JVM implementation must be installed for different operating systems and CPU architectures.
- C. The JRE contains developmental tools such as `javac` (the Java Compiler) and `jar` (the archiving tool).
- D. Java bytecode is platform-independent, and the same `.class` file can run on any platform as long as a compatible JVM is installed.
- E. The JDK contains both the JRE and development tools, making it a superset of the JRE.

**Answer: B, D, E**
**Detailed Explanation:**
- **A is incorrect:** Java bytecode (`.class` files) is completely platform-independent. The compiler (`javac`) parses the source code and outputs standard bytecode that conforms to the JVM Specification, regardless of which OS the compiler is running on.
- **B is correct:** The JVM (Java Virtual Machine) translates bytecode into native machine instructions at runtime. Since native machine code differs between operating systems (e.g., Windows vs. macOS) and CPU architectures (e.g., x86_64 vs. ARM64), the JVM itself must be platform-dependent.
- **C is incorrect:** The JRE (Java Runtime Environment) only contains the components necessary to *run* Java applications (the JVM and core libraries). Development tools like `javac`, `jar`, and debuggers are strictly part of the JDK (Java Development Kit).
- **D is correct:** This is the core tenet of "Write Once, Run Anywhere" (WORA). The bytecode is universal; the local JVM handles the translation to OS-specific instructions.
- **E is correct:** The JDK includes the JRE (allowing developers to run Java programs) as well as the tools required for development.

---

### Question 2: The Main Method Signatures
Given the following code snippets, which of them can be executed directly by the JVM as a valid entry point? (Select all that apply)
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
- A. Snippet I and II only
- B. Snippet I, II, and IV only
- C. Snippet I, II, III, and IV
- D. Snippet I and IV only

**Answer: B**
**Detailed Explanation:**
- **Snippet I (Valid):** The JVM searches for `public static void main(String[] args)`. 
  - The `final` keyword is allowed in the `main` method signature; it simply prevents overriding, which does not affect the JVM's ability to call it.
  - Varargs (`String... args`) are compiled down to a standard `String[]` array, so the JVM recognizes this signature.
- **Snippet II (Valid):** 
  - Access modifiers and method modifiers can appear in any order before the return type. Therefore, `static public synchronized void main` is acceptable. The `synchronized` modifier is permitted (though rarely used here).
  - The parameter name does not have to be `args`; `arguments` is perfectly fine.
- **Snippet III (Invalid):** The parameter type must be an array of `String` or a vararg of `String`. Here, it is a single `String` (`String args`). Although this compiles, running it will cause a `NoSuchMethodError` at runtime because the JVM cannot locate the standard entry point.
- **Snippet IV (Valid):** `java.lang.String[]` is the fully qualified name of the `String` class. The compiler and JVM resolve this identically to `String[]`.

---

### Question 3: Compilation and Execution of Single-File Source Code Programs
Beginning with Java 11 (and refined in later versions), you can run a single Java source file directly using the `java` launcher (e.g., `java MyClass.java`). Which of the following statements is TRUE regarding this feature?
- A. The `java` command compiles the file into a `.class` file on the hard drive and then runs it.
- B. The source file must have the same name as the public class defined inside it, just like normal compilation.
- C. The code is compiled in memory and executed; no `.class` file is generated on disk.
- D. You can execute a multi-file project using this command as long as they are in the same directory.

**Answer: C**
**Detailed Explanation:**
- **A is incorrect / C is correct:** The single-file source-code launcher compiles the code directly into memory. It does not write any `.class` files to the filesystem, keeping the workspace clean.
- **B is incorrect:** When launching a single-file program, the launcher runs the first class defined in the source file, regardless of whether its name matches the filename. For example, if `java Test.java` contains `public class Runner { ... }` as the first class, it will execute.
- **D is incorrect:** The single-file launcher only compiles and executes the specified source file. If the file refers to other custom classes not compiled or not on the classpath, the execution will fail with a compilation error at runtime.

---

### Question 4: Phases of Dynamic Class Loading
At which phase of the JVM class loading lifecycle are static variables allocated memory and initialized to their default values (e.g., `0`, `false`, `null`)?
- A. Loading
- B. Verification
- C. Preparation
- D. Initialization

**Answer: C**
**Detailed Explanation:**
- **Loading (A):** The JVM reads the bytecode binary stream for a class and constructs a `java.lang.Class` object in the Metaspace.
- **Verification (B):** This is the first step of the Linking phase, where the JVM ensures that the bytecode is valid, structurally sound, and doesn't violate safety guidelines.
- **Preparation (C):** Memory is allocated for static fields of the class, and they are initialized to their default values for their respective types (e.g., `0` for numeric primitives, `false` for booleans, `null` for object references). Real values declared in the code (e.g. `public static int x = 42;`) are not assigned yet.
- **Initialization (D):** This is the phase where static variable initializers (like assigning `42` to `x`) and static block initializers (`static { ... }`) are executed in the order they appear in the source code.

---

### Question 5: Execution Order of Initializers
What is the output of running the following Java application?
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
**Detailed Explanation:**
1. When the JVM starts, it loads the class containing the `main` method (`InitOrder`).
2. During the **Initialization** phase of the class loading process, static variables and static blocks are executed in the order they appear. Thus, the static block `static { System.out.print("A "); }` runs first, printing `A `.
3. The JVM then executes the `main` method. The first statement in `main` is `System.out.print("D ");`, printing `D `.
4. Next, `new InitOrder()` is called to instantiate the class:
   - Superclass constructors/initializers run first (here, `java.lang.Object`).
   - Instance initializers and instance variable initializers of the class run in the order they appear. The block `{ System.out.print("B "); }` runs, printing `B `.
   - The constructor constructor body runs: `System.out.print("C ");`, printing `C `.
5. A second instance of `InitOrder` is created via `new InitOrder()`. Note that static initializers do **not** run again (they run exactly once per class loader lifetime).
   - Instance initializers run: prints `B `.
   - Constructor runs: prints `C `.
Combining the output: `A D B C B C`.

---

### Question 6: Class Loader Hierarchy
Which Java class loader is responsible for loading the core runtime classes (such as classes in the `java.base` module like `java.lang.Object`, `java.lang.String`)?
- A. Application Class Loader (System Class Loader)
- B. Platform Class Loader (Extension Class Loader)
- C. Bootstrap Class Loader
- D. Dynamic Class Loader

**Answer: C**
**Detailed Explanation:**
- **Bootstrap Class Loader (C):** This is the parent of all class loaders. It is built into the JVM core and loads critical runtime classes from the JDK base modules (like `java.base`). In modern JDKs, it returns `null` when represented in Java (e.g., `String.class.getClassLoader()` returns `null`).
- **Platform Class Loader (B):** (Formerly Extension Class Loader in older Java versions). It loads platform-specific Java SE classes and extension APIs.
- **Application Class Loader (A):** Also known as the System Class Loader, it loads classes from the application classpath (defined by `-cp` or `--class-path`).
- **Dynamic Class Loader (D):** This is not a standard built-in JVM class loader.

---

### Question 7: System.gc() Semantics
Which of the following describes the guarantee provided by invoking `System.gc()` in a Java program?
- A. It guarantees that the Garbage Collector will run immediately and reclaim all unused objects.
- B. It guarantees that the JVM will run a full garbage collection cycle before the method returns.
- C. It suggests to the JVM that it should spend effort recycling unused objects, but provides no guarantee that the collector will run.
- D. It suspends all application threads until the heap usage is reduced below 50%.

**Answer: C**
**Detailed Explanation:**
- Calling `System.gc()` (or `Runtime.getRuntime().gc()`) is merely a **hint** or suggestion to the JVM that it might be a good time to run garbage collection.
- The JVM is free to ignore this request completely. Modern garbage collectors optimize collection cycles autonomously, and invoking this manually is considered bad practice because it can trigger expensive stop-the-world collections if the JVM decides to respect it, or do nothing at all.

---

### Question 8: Command Line Options for Classpath
Suppose you have a compiled class file `Main.class` inside the package directory structure `com/study/helper/Main.class`. The absolute path to the root directory containing `com` is `/app/classes`. Which command correctly executes the application?
- A. `java /app/classes/com/study/helper/Main`
- B. `java -cp /app/classes Main`
- C. `java -cp /app/classes com.study.helper.Main`
- D. `java -cp /app/classes/com/study/helper Main`

**Answer: C**
**Detailed Explanation:**
- When executing a class that belongs to a package, you must specify the fully qualified class name (FQCN) to the `java` tool, which is `com.study.helper.Main`.
- The classpath (`-cp` or `--class-path`) must point to the **root** folder where the package structure begins, which is `/app/classes`.
- The JVM will append the package directory structure to the classpath root to search for the `.class` file: `/app/classes` + `com/study/helper/Main.class`.
- **A is incorrect:** You cannot pass a file path to execute compiled bytecode directly.
- **B is incorrect:** The FQCN is missing.
- **D is incorrect:** The classpath points directly to the leaf directory, meaning the JVM will look for a class called `Main` without a package inside that folder, but `Main.class` contains a package header (`package com.study.helper;`), resulting in a `NoClassDefFoundError` at runtime.

---

### Question 9: Static Imports
Consider the following file `Calculator.java`:
```java
package com.math;
public class Calculator {
    public static int add(int a, int b) { return a + b; }
}
```
And another file `App.java`:
```java
package com.app;
// INSERT IMPORT HERE
public class App {
    public static void main(String[] args) {
        System.out.println(add(5, 10));
    }
}
```
Which of the following lines can be inserted at `// INSERT IMPORT HERE` to make `App.java` compile successfully? (Select all that apply)
- A. `import com.math.Calculator.add;`
- B. `import static com.math.Calculator.add;`
- C. `import static com.math.Calculator.*;`
- D. `import com.math.Calculator.*;`
- E. `static import com.math.Calculator.add;`

**Answer: B, C**
**Detailed Explanation:**
- To import static members (like methods or fields) of a class so they can be referenced without their class name qualifier, you must use the syntax `import static <fully-qualified-class-name>.<member-name>;` or `import static <fully-qualified-class-name>.*;`.
- **A is incorrect:** Standard `import` is used for importing classes/interfaces, not individual methods or static fields.
- **B is correct:** Imports the static method `add` specifically.
- **C is correct:** Wildcard static import that imports all static members of `Calculator`.
- **D is incorrect:** This imports the classes inside the `com.math.Calculator` package (which is syntactically invalid because `Calculator` is a class, not a package).
- **E is incorrect:** The syntax is `import static`, not `static import`.

---

### Question 10: JVM Memory Spaces - Metaspace vs. Heap vs. Stack
Where does the JVM store class metadata (such as class definitions, method bytecode, annotations, and the constant pool) in Java 21?
- A. Java Heap
- B. Metaspace
- C. Java Stack (Thread Stack)
- D. Garbage Collection Root

**Answer: B**
**Detailed Explanation:**
- **Metaspace (B):** Since Java 8, class metadata is stored in native memory known as **Metaspace**. Unlike the Heap, Metaspace allocates space directly from the operating system's local memory, and it grows dynamically by default unless limited by JVM arguments (e.g. `-XX:MaxMetaspaceSize`).
- **Heap (A):** Stores instances of objects and arrays.
- **Java Stack (C):** Stores local variables, reference variables pointing to the heap, and frames for active method calls on a per-thread basis.
- **Garbage Collection Root (D):** This is a conceptual element (like local variables, active threads, JNI references) used by the GC algorithm to trace live objects, not a physical memory storage area.

---

### Question 11: Main Method Overloading
What is the behavior of the following program when compiled and run using `java MainOverload`?
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
- A. The program fails to compile due to duplicate method name `main`.
- B. The program compiles and runs, printing: `A B `
- C. The program compiles and runs, printing: `A B C `
- D. The program compiles, but throws a `NoSuchMethodError` at runtime.

**Answer: B**
**Detailed Explanation:**
- Like any other Java method, the `main` method can be **overloaded** with different parameter lists.
- The JVM looks specifically for the entry point signature matching `main(String[] args)` (or varargs). It launches that method first.
- In `main(String[] args)`, the code prints `A ` and then invokes `main("B")`.
- The call `main("B")` matches the overloaded `main(String arg)` method signature because `"B"` is a single `String`. This method runs and prints `B `.
- `main(String[] args, int extra)` is never invoked because there is no code that calls it.
- Hence, the output is `A B `.

---

### Question 12: Bytecode Compatibility and Major Version Errors
You compiled a Java source file using Java 21 compiler `javac` targeting class file version 21. If you attempt to execute this `.class` file on a machine running a Java 17 Runtime Environment (JRE), what will be the result?
- A. The class executes successfully because Java bytecode is backward compatible.
- B. The JVM throws a `java.lang.UnsupportedClassVersionError` at runtime.
- C. The class runs but throws an `InstantiationError` when the class is first loaded.
- D. The compiler throws a compile-time error.

**Answer: B**
**Detailed Explanation:**
- Java maintains **backward compatibility**: older `.class` files (compiled with older JDKs) can run on newer JVMs.
- However, Java does not support **forward compatibility**: newer `.class` files (compiled with newer JDKs targeting newer bytecode levels) cannot run on older JVMs.
- When an older JVM (like Java 17) reads the major/minor version headers in a class file generated by a newer compiler (like Java 21), it rejects the file by throwing a `java.lang.UnsupportedClassVersionError` (which is a subclass of `java.lang.LinkageError`).

---

### Question 13: The `java` command vs `javac` command behavior
Consider the following command execution on a clean system:
`javac -d bin src/com/helper/Worker.java`
Which of the following describes the output and behavior of this command?
- A. It compiles `Worker.java` and outputs the resulting `.class` file directly in the `bin` directory as `bin/Worker.class`.
- B. It compiles `Worker.java` and places the compiled output in `bin/com/helper/Worker.class`.
- C. It executes the `Worker.java` application and outputs stdout to the `bin` directory.
- D. It creates a package named `bin` and adds a dependency in `Worker.java`.

**Answer: B**
**Detailed Explanation:**
- The `-d` flag in the `javac` compiler specifies the **destination directory** for compiled class files.
- If the source file declares a package (e.g., `package com.helper;`), the compiler will automatically recreate the package folder structure under the destination directory.
- Therefore, the generated file is saved at `bin/com/helper/Worker.class`. This makes organizing builds and classpath compilation straightforward.

---

### Question 14: Single-File Source Code Package Conflicts
You have a single Java source file named `Demo.java` containing the following code:
```java
package com.demo;
public class Demo {
    public static void main(String[] args) {
        System.out.println("Running Demo");
    }
}
```
If you run this file from the terminal using `java Demo.java`, what happens?
- A. It fails to compile because a single-file program cannot have a `package` declaration.
- B. It compiles in memory and prints `Running Demo`.
- C. It compiles, but throws a `NoClassDefFoundError` because the package declaration does not match a directory structure on disk.
- D. It prints `Running Demo` but displays a warning about package compliance.

**Answer: B**
**Detailed Explanation:**
- When using the single-file source-code launcher (`java Demo.java`), a package declaration is **allowed**.
- Unlike standard classpath-based execution where package names must correspond directly to directories on the disk, the single-file launcher runs the in-memory compiled bytecode directly without checking directory nesting.
- Therefore, it compiles successfully and prints `Running Demo`.

---

### Question 15: Executable JAR Files and Manifest
You want to execute a packaged Java application inside `app.jar` using the command `java -jar app.jar`. Which of the following conditions must be met for this command to run successfully?
- A. The class containing the `main` method must be named `Main` and be in the default package.
- B. The JAR must contain a `META-INF/MANIFEST.MF` file with a `Main-Class` attribute designating the fully qualified name of the entry point class.
- C. The `-cp` or `-classpath` flag must be set explicitly to specify the internal files inside the JAR.
- D. The entry point class must inherit from `java.applet.Applet`.

**Answer: B**
**Detailed Explanation:**
- When running a JAR file using `java -jar <jarfile>`, the JVM ignores the `-cp` (or `-classpath`) command line argument.
- Instead, the entry point is identified by the `Main-Class` header inside the manifest file located at `META-INF/MANIFEST.MF` within the archive. For example: `Main-Class: com.study.Main`.
- If this header is missing or incorrect, the JVM will fail with the error: `no main manifest attribute, in app.jar`.

---

### Question 16: Variable Arguments (Varargs) and Empty CLI Arguments
Given the following program:
```java
public class VarargsEntry {
    public static void main(String... options) {
        System.out.println(options == null);
        System.out.println(options.length);
    }
}
```
What is printed when this program is executed using `java VarargsEntry` (with no additional command-line parameters)?
- A. `true` followed by a `NullPointerException`
- B. `false` followed by `0`
- C. `true` followed by `0`
- D. The JVM throws a `NoSuchMethodError` because the array is empty.

**Answer: B**
**Detailed Explanation:**
- The JVM always initializes the array of parameters passed to the `main` method, even if no command line arguments are provided.
- The parameter array is never `null`. It is initialized to an empty array (`new String[0]`).
- Therefore, `options == null` evaluates to `false`, and `options.length` evaluates to `0`. No exception is thrown.

---

### Question 17: Static Field Initialization with Exceptions
What happens when you compile and attempt to execute the following program?
```java
public class LoadException {
    static int value = 10 / 0; // ArithmeticException

    public static void main(String[] args) {
        System.out.println("Value: " + value);
    }
}
```
- A. The code fails to compile because the division by zero is detected.
- B. The program compiles successfully, but throws an `ArithmeticException` directly at runtime.
- C. The program compiles successfully, but throws a `java.lang.ExceptionInInitializerError` at runtime.
- D. The program compiles and prints `Value: Infinity`.

**Answer: C**
**Detailed Explanation:**
- **A is incorrect:** Although `10 / 0` throws an exception at runtime, it is syntactically valid code and compiles without errors.
- **B is incorrect / C is correct:** The division occurs during the class **Initialization** phase when static initializers run. When an unhandled runtime exception is thrown inside a static initialization block or static field initialization, the JVM wraps that exception inside a `java.lang.ExceptionInInitializerError`.
- If you check the stack trace, the root cause is indeed `java.lang.ArithmeticException: / by zero`, but the outer exception reported by the JVM loading thread is `ExceptionInInitializerError`.

---

### Question 18: System Properties Positioning
Which of the following commands correctly passes a system property named `debug` with the value `true` to the application `App`, so that it can be retrieved via `System.getProperty("debug")`?
- A. `java App -Ddebug=true`
- B. `java -Ddebug=true App`
- C. `java App debug=true`
- D. `javac -Ddebug=true App.java`

**Answer: B**
**Detailed Explanation:**
- To pass a system property to the JVM, the syntax `-D<name>=<value>` must be placed **before** the class name (the entry point) in the command-line argument sequence.
- **A is incorrect:** Any arguments specified *after* the class name are treated as standard program arguments and passed to the `main` method's `String[] args` array. The JVM will not interpret them as JVM system properties.
- **C is incorrect:** Passes `"debug=true"` as a program argument, not a system property.
- **D is incorrect:** `javac` is the compiler and does not run the application or set runtime system properties.

---

### Question 19: Strict Floating Point (`strictfp`)
Which of the following statements about the `strictfp` keyword is correct in Java 21?
- A. You must declare all classes that use double values as `strictfp` to compile them.
- B. The `strictfp` keyword has been completely removed from the language syntax and results in a compile-time error if used.
- C. Since Java 17, floating-point operations are consistently strict by default, making the `strictfp` keyword redundant (it is now ignored by the compiler).
- D. `strictfp` is required if you want to run calculations using Virtual Threads.

**Answer: C**
**Detailed Explanation:**
- Historically, `strictfp` was used to ensure that floating-point calculations (using `float` or `double`) yielded the exact same results across all platforms, regardless of the underlying processor's floating-point precision capabilities.
- Since Java 17, JVM floating-point semantics were updated to be strict by default. As a result, the `strictfp` keyword is now **redundant** and has no effect, although it remains in the language syntax as a keyword (it does not cause compilation errors for backward compatibility reasons).

---

### Question 20: Import Precedence Rules
Given the following directory and file structure:
`com/study/helper/Logger.class` (defines a public class `Logger` with a static method `log()`).

And the following source file:
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
Which of the following statements is true?
- A. The code fails to compile because importing `Logger` explicitly conflicts with the wildcard import `com.study.helper.*`.
- B. The compiler issues a warning, but compiles successfully.
- C. The code compiles without errors because explicit imports take precedence and do not conflict with wildcards.
- D. The code throws a `LinkageError` at runtime.

**Answer: C**
**Detailed Explanation:**
- Java allows both wildcard imports and explicit class imports from the same package.
- An explicit import (`import com.study.helper.Logger;`) is more specific than a wildcard import (`import com.study.helper.*;`), and redundant imports are resolved cleanly by the compiler without warnings or errors.
- Hence, the code compiles successfully.

