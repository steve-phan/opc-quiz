# Chapter 6: Class Design, Constructors & Initialization Order

## 1. Core Java 21 Exam Objectives
- Understand class design, methods, and access modifiers.
- Master the JVM class initialization and instance creation order.
- Implement constructor overloading and constructor chaining using `this()` and `super()`.
- Identify Garbage Collection (GC) roots and object eligibility rules.

---

## 2. Deep-Dive Concepts

### Constructor Chaining Rules
- **The first line rule:** The first statement of any constructor must be a call to another constructor in the same class (`this(...)`) or a constructor in the parent class (`super(...)`).
- **Default Constructor:** If you write no constructors, the compiler automatically inserts a default, no-argument constructor containing `super();`. If you write *any* constructor, the compiler does not insert the default constructor.
- **Implicit `super()`:** If you do not write an explicit `this(...)` or `super(...)` call on the first line, the compiler automatically inserts an implicit `super();` call.
- *OCP Trap:* If the parent class has constructors but does *not* have a no-argument constructor, any subclass constructors must explicitly call a valid parent constructor using `super(args);`. If they don't, the subclass will fail to compile!

### The Exact Order of JVM Initialization
When a class is loaded and instantiated, the JVM executes blocks in a strict sequence:

#### Step 1: Static Initialization (Runs once when the class is first loaded)
1. **Static Fields and Static Blocks:** Evaluated and executed in the order they appear in the source code.

#### Step 2: Instance Initialization (Runs every time a new object is created)
2. **Superclass Instance Initialization:** Runs the parent class's instance initialization blocks and constructor first.
3. **Subclass Instance Fields and Instance Blocks:** Evaluated and executed in the order they appear in the subclass source code.
4. **Subclass Constructor:** The remaining lines of the constructor body are executed.

---

## 3. JVM Internals & Memory Layout

### Bytecode View: `<clinit>` vs. `<init>`
The JVM compiler groups initialization code into two special internal methods:
1. **`<clinit>` (Class Initializer):** Contains all static field assignments and static blocks. The JVM executes `<clinit>` automatically when the class is first loaded (triggered by accessing a static member or calling `new`).
2. **`<init>` (Instance Initializer):** Contains all instance field assignments, instance initialization blocks, and the constructor code. The compiler generates one `<init>` method for every constructor in the class.

```
+-------------------------------------------------------+
| JVM INITIALIZATION ENGINE                             |
|                                                       |
| 1. Load Class -> Run <clinit>                         |
|    - Static fields (in order)                         |
|    - Static blocks (in order)                         |
|                                                       |
| 2. Create Instance -> Run <init>                      |
|    - Call superclass <init> (super() chaining)        |
|    - Subclass instance fields & blocks (in order)     |
|    - Subclass constructor body                        |
+-------------------------------------------------------+
```

### Garbage Collection (GC) Eligibility & GC Roots
An object on the Heap is eligible for garbage collection as soon as it is no longer reachable from any **GC Root**.
A **GC Root** is a reference source that is guaranteed to be alive:
1. **Local variables:** References held in active Thread Stack frames.
2. **Static variables:** References held by loaded classes in Metaspace.
3. **JNI (Java Native Interface):** References held in native C/C++ code.

```
+-------------------------------------------------------------+
| JVM MEMORY & GC ROOTS                                       |
|                                                             |
|   [ Stack Frame (GC Root) ]                                 |
|   - Local Ref `book` ---------------> [ Book Object A ]     |
|                                         (Reachable - Kept)  |
|                                                             |
|                                       [ Book Object B ]     |
|                                         (Unreachable!       |
|                                          Eligible for GC)   |
+-------------------------------------------------------------+
```
*OCP Trap:* Setting a reference to `null` is a common way to make an object eligible for GC, but GC eligibility is about reachability. If an object is pointing to other objects, they may *all* become eligible if the entire island of objects becomes disconnected from any active GC root (called an **Island of Isolation**).

---

## 4. Tricky OCP Exam Questions

### Question 1: Advanced Class Initialization Order
What is the output of executing the following program?
```java
class Base {
    static { System.out.print("A "); }
    { System.out.print("B "); }
    Base() { System.out.print("C "); }
}

class Derived extends Base {
    static { System.out.print("D "); }
    { System.out.print("E "); }
    Derived() {
        this(10);
        System.out.print("F ");
    }
    Derived(int x) {
        super();
        System.out.print("G ");
    }
}

public class InitFlow {
    public static void main(String[] args) {
        System.out.print("Start ");
        new Derived();
    }
}
```
- A. `Start A D B C E G F`
- B. `A D Start B C E G F`
- C. `Start A D B C E F G`
- D. `A D Start B C E F G`

**Answer: A**
**Detailed Explanation:**
- When the JVM starts, it loads the main class `InitFlow`.
- The first statement in `main` is `System.out.print("Start ");`, which executes and prints `"Start "`.
- Next, `new Derived()` is called. This triggers class loading for `Derived`.
- Since `Derived` extends `Base`, the JVM first loads the superclass `Base`, executing its static initializers. This prints `"A "`.
- The JVM then loads the subclass `Derived`, executing its static initializers. This prints `"D "`.
- Now class loading is complete, and instance allocation begins:
  - The default constructor `Derived()` is invoked.
  - The first statement is `this(10);`, which redirects to the overloaded constructor `Derived(int x)`.
  - In `Derived(int x)`, the first statement is `super();` (explicitly calling the `Base` constructor).
  - This transfers execution to the superclass `Base` instance initialization.
  - The instance initializers of `Base` run first, printing `"B "`.
  - The constructor body of `Base` runs next, printing `"C "`.
  - Control returns to `Derived` instance initialization.
  - The subclass instance initializers (`{ System.out.print("E "); }`) run, printing `"E "`.
  - The body of `Derived(int x)` completes, printing `"G "`.
  - Control returns to `Derived()`, which completes its body, printing `"F "`.
- Output: `Start A D B C E G F`.

---

### Question 2: Polymorphism inside Constructors (Polymorphic Trap)
What is the output of executing the following code?
```java
class Alpha {
    Alpha() {
        printName();
    }
    void printName() {
        System.out.print("Alpha ");
    }
}

class Beta extends Alpha {
    private String name = "Beta";
    
    @Override
    void printName() {
        System.out.print(name + " ");
    }
}

public class PolyConstructor {
    public static void main(String[] args) {
        new Beta();
    }
}
```
- A. `Alpha`
- B. `Beta`
- C. `null`
- D. Fails to compile due to override rules.

**Answer: C**
**Detailed Explanation:**
- This is a classic and highly tricky OCP exam question demonstrating the danger of calling overridable methods inside constructors.
- **Step 1:** `new Beta()` is called. The `Beta` constructor implicitly invokes the parent constructor `super()`.
- **Step 2:** Inside the `Alpha` constructor, the method `printName()` is called.
- **Step 3:** Because method invocation in Java is **polymorphic** (resolved using virtual method invocation based on the actual runtime object type), the JVM executes the overridden method `printName()` inside the subclass `Beta`.
- **Step 4:** At this point in time, the `Beta` instance fields (specifically `name = "Beta"`) have **not yet been initialized**. Instance variables of a subclass are initialized only *after* the superclass constructor completes.
- Therefore, the instance variable `name` still holds its default initialization value, which is `null`.
- The subclass `printName()` method executes `System.out.print(name + " ");`, printing `"null "`.
- **Step 5:** After the `Alpha` constructor completes, the JVM initializes `name` to `"Beta"`, but it is too late to affect the constructor output.
- Output: `null `.

---

### Question 3: Blank Final Variables in Constructors
Which of the following constructor structures will fail to compile?
```java
// Option I
class FinalVar1 {
    private final int value;
    public FinalVar1() {
        value = 10;
    }
}

// Option II
class FinalVar2 {
    private final int value;
    public FinalVar2() {
        this(5);
    }
    public FinalVar2(int val) {
        value = val;
    }
}

// Option III
class FinalVar3 {
    private final int value;
    { value = 10; }
    public FinalVar3() {
        // empty
    }
}

// Option IV
class FinalVar4 {
    private final int value;
    public FinalVar4() {
        // empty
    }
    public FinalVar4(int val) {
        value = val;
    }
}
```
- A. Option IV only
- B. Option I and IV only
- C. Option II and III only
- D. None of them; all options compile successfully.

**Answer: A**
**Detailed Explanation:**
- If an instance field is declared `final`, it must be initialized exactly once by the time the instance creation process completes.
- It can be initialized:
  - At declaration line (e.g. `private final int value = 10;`).
  - Inside an instance initialization block (Option III).
  - Inside **every** constructor of the class (Option I).
- In Option II, `FinalVar2()` delegates to `FinalVar2(int)`, which initializes `value`. This is valid.
- In **Option IV**, the no-argument constructor `FinalVar4()` does **not** initialize `value` (and does not delegate to another constructor). Since there is a constructor path where the blank final field is left uninitialized, the compiler throws an error: `variable value might not have been initialized`.

---

### Question 4: Islands of Isolation (GC Eligibility)
Consider the following program:
```java
public class GCIsland {
    GCIsland partner;

    public static void main(String[] args) {
        GCIsland a = new GCIsland(); // Object 1
        GCIsland b = new GCIsland(); // Object 2
        
        a.partner = b;
        b.partner = a;
        
        a = null;
        b = null;
        // Line 11
    }
}
```
At Line 11, how many objects are eligible for garbage collection?
- A. 0
- B. 1
- C. 2
- D. They are not eligible until the JVM shuts down because they reference each other.

**Answer: C**
**Detailed Explanation:**
- When `a = null` and `b = null` are executed, the local variable stack frames no longer hold references to Object 1 or Object 2.
- Even though Object 1 and Object 2 reference each other (forming a circular dependency or "Island of Isolation"), they are no longer reachable from any **GC Root** (like stack frames, static fields, etc.).
- Because they are unreachable from active program roots, the Garbage Collector can identify them as dead objects and reclaim them.
- Therefore, both objects (2) are eligible for garbage collection.

---

### Question 5: Private Constructor and Inheritance
What is the compilation result of the following code?
```java
class Base {
    private Base() {}
}

class Sub extends Base {
    public Sub() {
        super();
    }
}
```
- A. Compiles successfully.
- B. Fails to compile because `Sub` cannot access the private constructor of `Base`.
- C. Fails to compile because `Base` must be declared abstract.
- D. Compiles but throws an IllegalAccessError at runtime.

**Answer: B**
**Detailed Explanation:**
- Constructors are not inherited, but the subclass constructor must always call a parent constructor (either implicitly or explicitly).
- The `Base` class constructor is declared `private`. This limits its visibility exclusively to the `Base` class itself.
- Subclass constructor `Sub()` calls `super();`, which attempts to access the private constructor of the parent class.
- Since it is inaccessible, compilation fails with the error: `Base() has private access in Base`.
- *(Note: Declaring only private constructors in a class effectively prevents it from being extended).*

---

### Question 6: Static Field Hiding (Non-Polymorphic Fields)
What is the output of the following program?
```java
class Parent {
    public int x = 10;
    public void print() {
        System.out.print(x + " ");
    }
}

class Child extends Parent {
    public int x = 20;
    @Override
    public void print() {
        System.out.print(x + " ");
    }
}

public class FieldHiding {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.print(p.x + " ");
        p.print();
    }
}
```
- A. `10 10 `
- B. `20 20 `
- C. `10 20 `
- D. `20 10 `

**Answer: C**
**Detailed Explanation:**
- In Java, **polymorphism applies only to instance methods, not to instance variables**.
- When a subclass defines an instance variable with the same name as a variable in the superclass, the subclass variable **hides** the parent variable.
- Which variable is accessed depends on the **declared reference type** at compile time, not the actual runtime object type.
- `Parent p = new Child();` declares a reference `p` of type `Parent`.
- Therefore, `p.x` accesses the variable `x` defined in the `Parent` class, yielding `10`.
- However, calling `p.print()` executes the overridden method `print()` inside `Child` because method resolution is polymorphic.
- Inside `Child.print()`, `x` refers to the variable defined in `Child`, yielding `20`.
- Combined output: `10 20 `.

---

### Question 7: Constructor Overloading Resolution
Given the overloaded constructors:
```java
public class MatchTest {
    public MatchTest(double d) { System.out.print("double "); }
    public MatchTest(Integer i) { System.out.print("Integer "); }
    public MatchTest(int... x) { System.out.print("varargs "); }

    public static void main(String[] args) {
        new MatchTest(5);
    }
}
```
What is printed?
- A. `Integer `
- B. `double `
- C. `varargs `
- D. Fails to compile due to ambiguous constructor matching.

**Answer: B**
**Detailed Explanation:**
- The compiler tries to resolve method/constructor calls using a strict precedence list:
  1. **Exact Match:** Look for a parameter of type `int`. Since none exists here, look for the next best.
  2. **Widening (Primitive Promotion):** Widening `int` to `double` (via primitive promotion) is preferred over autoboxing.
  3. **Autoboxing:** Autoboxing `int` to `Integer`.
  4. **Varargs:** Match the variable arguments `int...`.
- Since widening is preferred over autoboxing and varargs, the compiler promotes `5` to `5.0` and matches the constructor `MatchTest(double)`.
- Output: `double `.

---

### Question 8: Static Members and Inheritance (Hiding)
What is the output of executing the following class?
```java
class Super {
    public static void show() {
        System.out.print("Super ");
    }
}

class Sub extends Super {
    public static void show() {
        System.out.print("Sub ");
    }
}

public class StaticHiding {
    public static void main(String[] args) {
        Super s = new Sub();
        s.show();
    }
}
```
- A. `Sub `
- B. `Super `
- C. Fails to compile because static methods cannot be overridden.
- D. Throws a ClassCastException at runtime.

**Answer: B**
**Detailed Explanation:**
- Static methods **cannot be overridden**; they can only be **hidden**.
- When a static method is called, the JVM does not apply dynamic dispatch (polymorphism).
- Instead, the method called is determined strictly by the **compile-time declared reference type** of the variable.
- Since `s` is declared as `Super`, the compiler binds `s.show()` to `Super.show()`.
- Output: `Super `.
- *(Note: It is considered bad practice to call static methods on instances. You should write `Super.show();` instead).*

---

### Question 9: Class Initialization Trigger by Constant Variables
What is the output of the following program?
```java
class Loaded {
    public static final int CONSTANT = 100;
    public static int variable = 200;
    static {
        System.out.print("LoadedClass ");
    }
}

public class TriggerTest {
    public static void main(String[] args) {
        int x = Loaded.CONSTANT;
        System.out.print(x + " ");
        int y = Loaded.variable;
        System.out.print(y);
    }
}
```
- A. `LoadedClass 100 200`
- B. `100 LoadedClass 200`
- C. `100 200 LoadedClass`
- D. `LoadedClass 100 LoadedClass 200`

**Answer: B**
**Detailed Explanation:**
- Accessing a static `final` variable that is initialized to a compile-time constant expression does **not** trigger class loading or class initialization.
- The compiler copies the value (`100`) directly into the bytecode of the calling class (`TriggerTest`), so the JVM does not need to load the `Loaded` class at that line. Thus, `int x = Loaded.CONSTANT;` runs without loading the class and prints `100 `.
- However, accessing a static variable that is non-final (or not a compile-time constant, like `Loaded.variable`) **does** trigger class loading and initialization.
- When `Loaded.variable` is accessed, the JVM loads `Loaded` and executes its static block, printing `"LoadedClass "`.
- Finally, the value `200` is printed.
- Output: `100 LoadedClass 200`.

---

### Question 10: Blank Final Static Fields
Which of the following static field declarations compiles successfully?
- A.
  ```java
  class StaticVar {
      public static final int VALUE;
  }
  ```
- B.
  ```java
  class StaticVar {
      public static final int VALUE;
      { VALUE = 10; }
  }
  ```
- C.
  ```java
  class StaticVar {
      public static final int VALUE;
      static { VALUE = 10; }
  }
  ```
- D.
  ```java
  class StaticVar {
      public static final int VALUE;
      public StaticVar() { VALUE = 10; }
  }
  ```

**Answer: C**
**Detailed Explanation:**
- A `static final` variable must be initialized exactly once when the class is loaded.
- It **cannot** be initialized in instance scopes (like instance blocks or constructors) because those blocks run only when an object is instantiated, and static final variables must be ready before any instances are created.
- Therefore, it must be initialized:
  - At the declaration line.
  - Inside a **static initialization block** (`static { ... }`).
- **C** correctly uses a static initialization block. **A**, **B**, and **D** result in compilation errors.

---

### Question 11: Nested Constructor Chaining Call
What is the compilation result of the following code?
```java
public class CycleConstructor {
    public CycleConstructor() {
        this(5);
    }
    public CycleConstructor(int x) {
        this();
    }
}
```
- A. Compiles successfully, but results in a StackOverflowError at instantiation.
- B. Fails to compile due to recursive constructor invocation.
- C. Compiles but warns about deadlocks.
- D. Compiles and runs safely as long as no parameters are passed.

**Answer: B**
**Detailed Explanation:**
- Java prohibits circular constructor chaining (constructors calling each other in a loop).
- The compiler detects that `CycleConstructor()` calls `CycleConstructor(int)`, which in turn calls `CycleConstructor()`.
- The compiler flags this circular dependency and rejects the code with a compilation error: `recursive constructor invocation`.

---

### Question 12: Superclass constructor exceptions
Consider the following class declarations:
```java
class BaseException extends Exception {}

class Parent {
    public Parent() throws BaseException {}
}

class Child extends Parent {
    // INSERT CONSTRUCTOR HERE
}
```
Which of the following constructors can be inserted in `Child` to make it compile successfully?
- A. `public Child() {}`
- B. `public Child() throws Exception {}`
- C. `public Child() { try { super(); } catch(BaseException e) {} }`
- D. None of the above.

**Answer: B**
**Detailed Explanation:**
- Since the subclass constructor implicitly or explicitly calls `super()`, and the parent constructor declares throws `BaseException`, the subclass constructor **must declare that it throws the same exception (or a superclass exception like Exception)**.
- **A is incorrect:** It does not declare throws, resulting in unhandled exception compile error.
- **C is incorrect:** The call `super();` must be the very first statement in a constructor. Placing it inside a `try-catch` block violates this rule, so the code fails to compile.
- **B is correct:** Declares `throws Exception`, which handles the checked exception thrown by the parent constructor.

---

### Question 13: Covariant Return Types in Overriding
Which method declaration is valid in a subclass of `Parent`?
```java
class Parent {
    public Object getValue() { return null; }
}
```
- A. `public void getValue() {}`
- B. `public String getValue() { return "text"; }`
- C. `private Object getValue() { return null; }`
- D. `public Object getValue() throws Exception {}`

**Answer: B**
**Detailed Explanation:**
- **Covariant return types** are allowed in Java method overriding. The subclass method can return a type that is a **subclass** of the type returned by the parent method (here, `String` is a subclass of `Object`).
- **A is incorrect:** You cannot change the return type to an incompatible type (like `void`).
- **C is incorrect:** An overriding method cannot assign a **weaker** access privilege (from `public` to `private`).
- **D is incorrect:** An overriding method cannot throw new or broader checked exceptions.

---

### Question 14: Method Overloading with autoboxing vs varargs
Given the class:
```java
public class OverloadPrec {
    public static void test(Integer x) { System.out.print("Integer "); }
    public static void test(long x) { System.out.print("long "); }

    public static void main(String[] args) {
        test(5);
    }
}
```
What is printed?
- A. `Integer `
- B. `long `
- C. Fails to compile.
- D. Throws an exception at runtime.

**Answer: B**
**Detailed Explanation:**
- When resolving overloaded methods, widening (primitive promotion, e.g. `int` to `long`) takes precedence over autoboxing (`int` to `Integer`).
- Therefore, the compiler promotes `5` to a `long` and invokes `test(long)`.
- Output: `long `.

---

### Question 15: Abstract classes and constructors
Which of the following is true about abstract classes in Java?
- A. They cannot have constructors because they cannot be instantiated.
- B. They can have constructors, which are invoked during subclass instantiation.
- C. They can have constructors, but they must be declared `private`.
- D. They cannot declare static methods.

**Answer: B**
**Detailed Explanation:**
- Although you cannot instantiate an abstract class using `new AbstractClass()`, abstract classes **can and do have constructors**.
- These constructors are invoked by subclasses via constructor chaining (`super()`) to initialize the instance fields declared in the abstract parent class.
- Therefore, B is correct.

---

### Question 16: Hidden Fields Access using super
What is the output of running this code segment?
```java
class A {
    int val = 10;
}
class B extends A {
    int val = 20;
    void show() {
        System.out.println(super.val + " " + this.val);
    }
}
public class FieldAccess {
    public static void main(String[] args) {
        new B().show();
    }
}
```
- A. `10 20`
- B. `20 20`
- C. `20 10`
- D. Fails to compile because `val` is hidden.

**Answer: A**
**Detailed Explanation:**
- When an instance variable is hidden by a subclass, the subclass can still access the hidden parent field using the `super` keyword (`super.val`).
- The subclass field is accessed using `this.val` or simply `val`.
- Thus, `super.val` yields `10`, and `this.val` yields `20`.
- Output: `10 20`.

---

### Question 17: Static blocks execution order with multiple classes
What is the output of executing the following program?
```java
class X {
    static { System.out.print("X"); }
}
class Y extends X {
    static { System.out.print("Y"); }
}
public class ClassLoad {
    public static void main(String[] args) {
        Y y1 = new Y();
        Y y2 = new Y();
    }
}
```
- A. `XYXY`
- B. `XY`
- C. `YXYX`
- D. `YX`

**Answer: B**
**Detailed Explanation:**
- Static initialization blocks run exactly **once** when the class is first loaded by the class loader.
- Creating the first instance `new Y()` loads `X` (prints `X`) and `Y` (prints `Y`).
- Creating the second instance `new Y()` does not trigger class loading because the classes are already loaded. No static blocks run.
- Hence, the output is `XY`.

---

### Question 18: Uninitialized final fields in constructors with branches
Which of the following constructor declarations compiles successfully?
- A.
  ```java
  class Test {
      final int x;
      public Test(boolean cond) {
          if (cond) x = 5;
      }
  }
  ```
- B.
  ```java
  class Test {
      final int x;
      public Test(boolean cond) {
          if (cond) { x = 5; } else { x = 10; }
      }
  }
  ```
- C.
  ```java
  class Test {
      final int x;
      public Test(boolean cond) {
          x = 5;
          if (cond) x = 10;
      }
  }
  ```
- D. All of the above.

**Answer: B**
**Detailed Explanation:**
- **A fails to compile:** If `cond` is `false`, `x` remains uninitialized.
- **B compiles successfully:** Both branches of the conditional statement initialize `x` exactly once.
- **C fails to compile:** If `cond` is `true`, `x` is assigned twice (`x = 5` then `x = 10`), which violates the rule that `final` variables can only be assigned once.

---

### Question 19: Calling abstract methods in constructors
What is the output of the following program?
```java
abstract class Parent {
    Parent() {
        show();
    }
    abstract void show();
}

class Child extends Parent {
    int val = 42;
    void show() {
        System.out.println(val);
    }
}

public class AbstractConstructor {
    public static void main(String[] args) {
        new Child();
    }
}
```
- A. `42`
- B. `0`
- C. Fails to compile.
- D. Throws a NullPointerException.

**Answer: B**
**Detailed Explanation:**
- Calling abstract/overridable methods inside a parent constructor works similarly to the polymorphic method trap.
- When `new Child()` is called, the parent constructor `Parent()` runs first and calls `show()`.
- The subclass overridden method `show()` is executed.
- Since the subclass instance field `val` has not been initialized yet (its assignment `val = 42` happens after the superclass constructor completes), it holds its default primitive value `0`.
- Therefore, the program prints `0`.

---

### Question 20: Constructors and Varargs overloading ambiguity
Given the class:
```java
public class VarargAmb {
    public VarargAmb(int... x) { System.out.print("varargs "); }
    public VarargAmb(Integer... x) { System.out.print("Integer varargs "); }

    public static void main(String[] args) {
        new VarargAmb(1, 2);
    }
}
```
What is the result?
- A. Prints `varargs `
- B. Prints `Integer varargs `
- C. Fails to compile due to ambiguity.
- D. Throws a runtime error.

**Answer: C**
**Detailed Explanation:**
- The compiler cannot decide between `int...` and `Integer...` when resolving varargs parameter list calls (both are considered equivalent distance in boxing conversion priorities for varargs).
- Therefore, the constructor call is ambiguous, and the compiler fails to compile the class.

