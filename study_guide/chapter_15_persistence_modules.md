# Chapter 15: NIO.2, Serialization & Java Modules (JPMS)

## 1. Core Java 21 Exam Objectives
- Master NIO.2 Path operations: `resolve()`, `relativize()`, and `normalize()`.
- Read file metadata using `BasicFileAttributes`.
- Implement Object Serialization and utilize `transient` fields.
- Understand the Java Platform Module System (JPMS) directives: `exports`, `requires`, `requires transitive`, `opens`, `uses`, `provides...with`.
- Memorize command-line syntax for compiling, packaging, and executing modular Java applications.

---

## 2. Deep-Dive Concepts

### NIO.2 Path Relocation Mechanics
Path manipulations do not access the physical file system; they are purely syntactic string operations.
- **`resolve(Path other)`:** Joins two paths. If `other` is absolute, it returns `other`.
- **`relativize(Path other)`:** Calculates the relative path from the current path to `other` (i.e. "how do I walk from path A to path B?").
- **`normalize()`:** Removes redundant path elements like `.` (current directory) and `..` (parent directory).

```java
Path p1 = Paths.get("/home/user");
Path p2 = Paths.get("/home/user/docs/file.txt");
Path relative = p1.relativize(p2); // docs/file.txt
```

### JPMS Module Directives
A module declares dependencies and accessibility in its `module-info.java` file:
- **`requires M`:** Specifies that this module depends on module `M`.
- **`requires transitive M`:** Declares a dependency on `M` and automatically exposes it to any other modules that require this module (dependency propagation).
- **`exports P`:** Shares package `P` with other modules.
- **`opens P`:** Grants runtime reflection access to package `P` while preventing compile-time imports.
- **`provides S with I`:** Registers class `I` as an implementation of service interface `S`.
- **`uses S`:** Declares that this module searches for implementations of service interface `S` at runtime.

---

## 3. JVM Internals & Memory Layout

### JPMS Encapsulation Enforcements
At runtime, the JVM builds a graph of modules.
- Classes inside non-exported packages are completely encapsulated. 
- Even if you cast or use reflection (`Field.setAccessible(true)`), the JVM runtime will throw an `InaccessibleObjectException` if the package is not explicitly `exports` or `opens` in its `module-info.java`.

### Serialization `serialVersionUID` Validation
During object deserialization, the JVM reads the binary stream and verifies the class metadata.
- If the stream contains a different `serialVersionUID` than the local loaded class, the JVM throws an `InvalidClassException`.
- If you do not declare a `serialVersionUID`, the compiler calculates a default 64-bit hash based on fields and methods. Changing any class member (even adding a private field) changes this hash, breaking compatibility with previously saved files. Always declare it explicitly:
  `private static final long serialVersionUID = 1L;`

---

## 4. Tricky OCP Exam Questions

### Question 1
What is the result of executing the following code segment?
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

**Answer: C**
**Detailed Explanation:**
- **NIO.2 Relativize Constraints:** The `relativize(Path)` method determines the relative path from one path to another.
- **Key Rule:** Both paths must be **either both absolute or both relative**.
- Since `p1` is an absolute path (`/home/user`) and `p2` is a relative path (`docs/file.txt`), the invocation fails at runtime and throws an `IllegalArgumentException` (printing `IAE`).

---

### Question 2
Given the path representation `/root/sub1/sub2/file.txt` on a UNIX system, what is the output of the following code?
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

**Answer: B**
**Detailed Explanation:**
- **Path Element Counting:**
  - The root element (`/` on UNIX or `C:\` on Windows) does **not** count as a name element and is ignored by `getNameCount()`.
  - The name elements are: `root` (Index 0), `sub1` (Index 1), `sub2` (Index 2), and `file.txt` (Index 3). Thus, `getNameCount()` returns `4`.
  - `path.subpath(begin, end)` returns a subpath from `begin` (inclusive) to `end` (**exclusive**). So `subpath(0, 2)` returns the elements at index 0 and 1: `root/sub1`.
  - Important: The returned subpath never contains the root component, even if the original path was absolute.
  - The output is `4 root/sub1`.

---

### Question 3
Consider the following class hierarchy for serialization:
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
If a `SubClass` instance is serialized and then deserialized, what is the consequence?
- A. The instance is successfully deserialized with its fields intact.
- B. Serialization throws `NotSerializableException`.
- C. Deserialization throws `InvalidClassException` at runtime because the superclass lacks a no-argument constructor.
- D. Deserialization succeeds, but the superclass fields are initialized to default values without error.

**Answer: C**
**Detailed Explanation:**
- **Serialization inheritance rules:**
  - If a class implements `Serializable` but its parent class (`SuperClass`) does not, the parent class must be initialized during the deserialization process.
  - To do this, the JVM must call the **no-argument constructor** (parameterless constructor) of the first non-serializable parent class in the inheritance chain.
  - Since `SuperClass` only has a `SuperClass(int)` constructor and no default constructor, deserialization fails at runtime with an `InvalidClassException` (or a subclass thereof).

---

### Question 4
Which of the following JPMS directives declares that a dependency is required during compile-time but is optional at runtime?
- A. `requires optional M;`
- B. `requires static M;`
- C. `requires transitive M;`
- D. `opens M;`

**Answer: B**
**Detailed Explanation:**
- **JPMS Static Dependency:** The directive `requires static M;` declares a dependency that is mandatory at **compile-time** but **optional** at runtime (the JVM classloader does not require it to be present if it is not accessed).
- `requires transitive` (C) makes the dependency visible to other modules requiring this module. `opens` (D) is used to permit runtime reflection. `requires optional` (A) is not valid JPMS syntax.

---

### Question 5
Suppose a modular application uses the Service Provider Interface (SPI). Module `com.test.consumer` consumes a service interface `com.test.Service`. Module `com.test.provider` provides an implementation `com.test.impl.ServiceImpl`.
Which declarations are correct for their respective `module-info.java` files? (Choose two)
- A. In consumer: `provides com.test.Service;`
- B. In consumer: `uses com.test.Service;`
- C. In provider: `provides com.test.Service with com.test.impl.ServiceImpl;`
- D. In provider: `uses com.test.impl.ServiceImpl with com.test.Service;`

**Answer: B, C**
**Detailed Explanation:**
- **SPI Module directives:**
  - The consumer of a service must declare that it uses the interface: `uses <interface-name>;` (Option B).
  - The provider of a service registers its implementation with the interface: `provides <interface-name> with <implementation-class>;` (Option C).
  - Option A is incomplete because `provides` always requires a `with` clause. Option D swaps the arguments.

---

### Question 6
What is the result of executing the following path operation?
```java
Path p1 = Paths.get("/user/home");
Path p2 = Paths.get("/user/home/docs");
System.out.println(p2.resolve(p1));
```
- A. `/user/home/docs/user/home`
- B. `/user/home`
- C. `/user/home/docs`
- D. Throws `IllegalArgumentException` because both paths are absolute.

**Answer: B**
**Detailed Explanation:**
- **resolve with absolute path:**
  - The `resolve(Path other)` method is used to combine paths.
  - **Special Rule:** If the passed argument `other` is an **absolute path** (like here `p1` = `/user/home`), the resolution stops and the method simply returns the passed absolute path `other` unmodified.
  - Therefore, `p2.resolve(p1)` returns `/user/home` directly.

---

### Question 7
Consider the serialization of the following class:
```java
import java.io.Serializable;

public class Employee implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    private transient Thread workerThread;
    private transient int age;
}
```
After serialization and subsequent deserialization, what are the values of `workerThread` and `age` on the restored instance?
- A. `null` and `0`
- B. The original `Thread` reference and `0`
- C. `null` and the original `age` value
- D. Serialization fails because `Thread` is not serializable.

**Answer: A**
**Detailed Explanation:**
- **Transient Fields:** 
  - Fields marked with the `transient` keyword are completely ignored during the serialization process. Their state is not written to the stream.
  - Since `Thread` is not serializable, it must be marked `transient`, otherwise serialization would abort with a `NotSerializableException` (making D incorrect).
  - Upon deserialization, transient fields are reset to their default Java values: reference types (`workerThread`) to `null`, and primitive numeric types (`age`) to `0`.

---

### Question 8
Which of the following commands correctly describes the module dependencies of a compiled module packaged inside a JAR named `core.jar`?
- A. `jar --describe-module --file=core.jar`
- B. `java --describe-module core.jar`
- C. `javac --describe-module core.jar`
- D. `jar --show-module core.jar`

**Answer: A**
**Detailed Explanation:**
- **Module Inspection command:** To inspect the metadata (`module-info.class`) of a packaged modular JAR file, you use the `jar` tool with the flags `--describe-module` (or `-d`) and `--file` (or `-f`), followed by the file name (Option A).
- Options B, C, and D do not offer this functionality in this syntax.

---

### Question 9
What is the difference between `Files.walk(Path)` and `Files.find(Path, int, BiPredicate, FileVisitOption...)`?
- A. `Files.walk` evaluates files eagerly, while `Files.find` is lazy.
- B. `Files.find` allows specifying a maximum depth and a filter for attributes, while `Files.walk` traverses all files down to maximum depth without metadata filters.
- C. `Files.walk` follows symbolic links by default, whereas `Files.find` does not.
- D. There is no difference; `Files.walk` calls `Files.find` internally.

**Answer: B**
**Detailed Explanation:**
- Both methods return a lazily-evaluated `Stream<Path>`.
- However, `Files.find` directly requires parameters for a maximum search depth (`maxDepth`) and a filter predicate (`BiPredicate`) which is passed both the path and its file attributes (`BasicFileAttributes`). This allows highly efficient searches based on metadata (e.g., file size or modification date).
- `Files.walk` by default traverses the entire tree and does not provide an integrated attributes filter.
- Both methods do **not** follow symbolic links by default (unless `FOLLOW_LINKS` is explicitly passed).

---

### Question 10
Under JPMS, which directive grants compile-time access to a package `com.core.utils` to **only** a specific module `com.app.ui`?
- A. `exports com.core.utils to com.app.ui;`
- B. `opens com.core.utils to com.app.ui;`
- C. `requires com.app.ui exports com.core.utils;`
- D. `provides com.core.utils with com.app.ui;`

**Answer: A**
**Detailed Explanation:**
- **Qualified Exports:** 
  - The syntax `exports <package> to <module>;` declares a qualified export. This means compile-time access to the package is restricted solely to the specified target module.
  - `opens...to` (B) only grants runtime reflection access to the package, not compile-time access.

---

### Question 11
What is the result of executing the following path operation?
```java
Path p = Paths.get("/etc/./sub/../config.txt");
System.out.println(p.normalize());
```
- A. `/etc/config.txt`
- B. `/etc/sub/config.txt`
- C. `/config.txt`
- D. `/etc/sub/../config.txt`

**Answer: A**
**Detailed Explanation:**
- **Path normalization:**
  - The `.` character represents the current directory and is removed (`/etc/./sub` -> `/etc/sub`).
  - The `..` character represents the parent directory and removes the immediately preceding directory component (`/etc/sub/../config.txt` -> `/etc/config.txt`).
  - The normalized path is `/etc/config.txt`.

---

### Question 12
Which of the following is true about JPMS service provider lookups?
- A. The lookup is performed using the `java.util.ServiceLoader` class.
- B. The consumer module must explicitly import the implementation class from the provider module.
- C. Implementations must declare a public constructor with no arguments or a public static provider method.
- D. Both A and C are correct.

**Answer: D**
**Detailed Explanation:**
- **SPI Service Lookup:**
  - Services are dynamically loaded at runtime using the `ServiceLoader.load(Class)` class (A is correct).
  - The consumer must not know or import the concrete implementation class directly (B is incorrect, as this would violate the loose coupling design of SPI).
  - The `ServiceLoader` requires that the implementation class has either a public constructor with no arguments or a public static provider method `public static S provider()` that returns the instance (C is correct).

---

### Question 13
What happens if you attempt to serialize a class that implements `Serializable`, but one of its non-static, non-transient fields refers to an object of a class that does NOT implement `Serializable`?
- A. The non-serializable object is ignored during serialization.
- B. The compiler fails to compile the class.
- C. Serialization fails at runtime with a `NotSerializableException`.
- D. The object is serialized using reflection, but deserialization fails.

**Answer: C**
**Detailed Explanation:**
- **Serialization Object Graphs:**
  - When an object is serialized, the JVM attempts to serialize the entire object graph (all referenced objects).
  - If a referenced field (which is neither `static` nor `transient`) points to an object that is not serializable, serialization will fail immediately at runtime with a `NotSerializableException`.
  - This is not checked by the compiler.

---

### Question 14
Which of the following methods of the `Files` class accesses the actual file system at the time of invocation? (Choose all that apply)
- A. `Path.toRealPath(LinkOption...)`
- B. `Files.isRegularFile(Path, LinkOption...)`
- C. `Paths.get(String, String...)`
- D. `Path.resolve(Path)`

**Answer: A, B**
**Detailed Explanation:**
- **Metadata and Filesystem access:**
  - Path manipulations like `Paths.get()` (C) or `Path.resolve()` (D) are purely syntactic string operations at the path level and do **not** access the file system.
  - `Path.toRealPath()` (A) accesses the file system to resolve symbolic links and checks if the file exists (throwing an `IOException` if it does not exist).
  - `Files.isRegularFile()` (B) reads file attributes directly from the file system.

---

### Question 15
What is the result of attempting to compile a class file named `module-info.java` containing the following code?
```java
import com.test.MyClass;

module my.module {
    requires java.base;
}
```
- A. Compiles successfully.
- B. Compilation fails because `import` statements are not allowed in `module-info.java`.
- C. Compilation fails because `java.base` is imported implicitly and cannot be required explicitly.
- D. Compilation fails because the module name must match the package structure.

**Answer: B**
**Detailed Explanation:**
- **module-info.java syntax rules:**
  - No `import` statements are allowed in a `module-info.java` file. Only module directives can be declared.
  - (Note: Specifying `requires java.base;` explicitly is redundant because every module implicitly depends on `java.base`, but it is allowed by the compiler and does not cause a compilation error).

---

### Question 16
Suppose you want to copy a file using NIO.2. If the destination file already exists, which option should be passed to `Files.copy` to overwrite the existing file?
- A. `StandardCopyOption.COPY_ATTRIBUTES`
- B. `StandardCopyOption.REPLACE_EXISTING`
- C. `LinkOption.NOFOLLOW_LINKS`
- D. `StandardCopyOption.OVERWRITE`

**Answer: B**
**Detailed Explanation:**
- To overwrite an existing target file during a copy or move operation, the option `StandardCopyOption.REPLACE_EXISTING` must be passed. Otherwise, the method will throw a `FileAlreadyExistsException`.

---

### Question 17
Given the following module dependency graph:
- Module `A` has `requires transitive B;`
- Module `B` has `requires transitive C;`
- Module `D` has `requires A;`

Which modules does Module `D` read implicitly?
- A. Only `A`
- B. `A` and `B` only
- C. `A`, `B`, and `C`
- D. None; dependencies must always be declared directly in JPMS.

**Answer: C**
**Detailed Explanation:**
- **Transitive dependency propagation:**
  - Thanks to `requires transitive`, readability propagates transitively (cascading).
  - Since `A` transitively requires `B`, any module requiring `A` (like `D`) automatically reads `B`.
  - Since `B` transitively requires `C`, any module requiring `B` (and therefore `D`) automatically reads `C`.
  - Module `D` thus implicitly reads `A`, `B`, and `C`.

---

### Question 18
What is the purpose of the `opens` directive in a `module-info.java` file?
- A. It permits compile-time and runtime access to public classes in the package.
- B. It permits runtime access via reflection to all classes in the package, while preventing compile-time imports.
- C. It makes the module open-source.
- D. It registers a service implementation.

**Answer: B**
**Detailed Explanation:**
- **Deep reflection access:** The `opens` directive allows external modules runtime access to classes and their private members using reflection (e.g., `setAccessible(true)`).
- However, it prevents normal compile-time importing. This is commonly required for frameworks like Spring, Hibernate, or Jackson.

---

### Question 19
What is the result of executing the following program?
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
- C. Throws `NullPointerException` at runtime.
- D. Compilation fails.

**Answer: B**
**Detailed Explanation:**
- A path consisting solely of the root directory (`/`) has zero name elements.
- Therefore, `getNameCount()` returns `0`.

---

### Question 20
Which of the following commands correctly executes a modular Java application with the main class `com.app.Main` inside the module `com.app.module` (with module directory `mods`)?
- A. `java --module-path mods -m com.app.module/com.app.Main`
- B. `java -cp mods com.app.module.com.app.Main`
- C. `java -m mods/com.app.module/com.app.Main`
- D. `java --module mods com.app.Main`

**Answer: A**
**Detailed Explanation:**
- **Executing Modular App:** The command to execute a modular application is `java --module-path <dir> -m <module-name>/<main-class>`.
- The `--module-path` flag can be abbreviated to `-p`, and `-m` stands for `--module`. Option A uses the correct syntax.

"
