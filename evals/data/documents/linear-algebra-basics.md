# Linear Algebra Basics

## Introduction

Linear algebra is the branch of mathematics that studies vectors, the spaces they live in, and the linear maps between those spaces. It is one of the most widely applied areas of mathematics. Computer graphics uses matrices to rotate and project 3D scenes onto a screen, machine learning represents datasets and model weights as large matrices, engineers solve systems of thousands of simultaneous equations when analysing structures and circuits, and search engines have ranked web pages using eigenvectors. This handout covers the core ideas a first course introduces: vectors, matrices, matrix multiplication, determinants, linear independence and eigenvalues, each with small worked examples.

## Vectors

### What a Vector Is

A vector in n-dimensional real space, written R^n, is an ordered list of n real numbers called its components. The vector v = (3, 4) lives in R^2 and can be pictured as an arrow from the origin to the point with x-coordinate 3 and y-coordinate 4. Geometrically, a vector has a magnitude (length) and a direction, but it has no fixed starting point: an arrow moved parallel to itself represents the same vector.

### Vector Operations

Two vectors of the same size are added component by component: (1, 2) + (3, -5) = (4, -3). Geometrically this is the "tip-to-tail" rule: place the second arrow at the tip of the first, and the sum runs from the start of the first to the tip of the second.

Multiplying a vector by a real number, called a scalar, multiplies every component by that number: 3 × (2, -1) = (6, -3). Scaling by a positive number stretches or shrinks the arrow; scaling by a negative number also reverses its direction.

A linear combination of vectors v1, v2, ..., vk is any expression of the form c1v1 + c2v2 + ... + ckvk, where the c's are scalars. Linear combinations are the central construction of the whole subject.

### Length and the Dot Product

The length, or norm, of a vector is computed with the Pythagorean theorem: the norm of (3, 4) is the square root of 9 + 16, which is 5. A vector of length 1 is called a unit vector, and any nonzero vector can be turned into one by dividing it by its own length; (3, 4) becomes (0.6, 0.8).

The dot product of two vectors multiplies matching components and adds the results. For u = (1, 2, 3) and w = (4, -5, 6), the dot product is 1×4 + 2×(-5) + 3×6 = 4 - 10 + 18 = 12. The dot product also equals the product of the two lengths times the cosine of the angle between the vectors. As a result, two nonzero vectors are perpendicular, or orthogonal, exactly when their dot product is zero. For example, (2, 1) and (-1, 2) are orthogonal because 2×(-1) + 1×2 = 0.

## Matrices

### Definitions and Notation

A matrix is a rectangular array of numbers arranged in rows and columns. A matrix with m rows and n columns is called an m × n matrix, and the entry in row i and column j is written a_ij. A matrix with the same number of rows and columns is square. The identity matrix, written I, is the square matrix with 1s on its main diagonal (top-left to bottom-right) and 0s elsewhere. The zero matrix has every entry equal to 0.

Matrices of the same size are added entry by entry and multiplied by scalars entry by entry, just like vectors. The transpose of a matrix A, written A^T, is obtained by turning its rows into columns, so an m × n matrix becomes n × m. A square matrix that equals its own transpose is called symmetric.

### Matrices as Systems of Equations

Matrices give a compact way to write systems of linear equations. The system

- 2x + y = 5
- x - 3y = -1

can be written as Ax = b, where A is the 2 × 2 coefficient matrix with rows (2, 1) and (1, -3), x is the unknown vector (x, y), and b = (5, -1). The standard method for solving such systems by hand is Gaussian elimination: add multiples of one equation to another to create zeros below the diagonal, producing an upper triangular system that can be solved by back substitution. Here, subtracting half of the first equation from the second gives -3.5y = -3.5, so y = 1 and then x = 2.

## Matrix Multiplication

### The Rule

The product AB is defined only when the number of columns of A equals the number of rows of B. If A is m × n and B is n × p, the product AB is m × p. The entry in row i and column j of AB is the dot product of row i of A with column j of B.

### Worked Example

Let A have rows (1, 2) and (3, 4), and let B have rows (5, 6) and (7, 8). Then:

- Row 1 of A dotted with column 1 of B: 1×5 + 2×7 = 19.
- Row 1 of A dotted with column 2 of B: 1×6 + 2×8 = 22.
- Row 2 of A dotted with column 1 of B: 3×5 + 4×7 = 43.
- Row 2 of A dotted with column 2 of B: 3×6 + 4×8 = 50.

So AB has rows (19, 22) and (43, 50).

Computing BA instead gives rows (23, 34) and (31, 46), which is different. This illustrates the most important warning about matrices: matrix multiplication is not commutative, so in general AB does not equal BA. Multiplication is, however, associative, meaning (AB)C = A(BC), and it distributes over addition. The identity matrix acts like the number 1: AI = IA = A for any square A of matching size.

### Matrices as Transformations

A matrix acts on a vector by multiplication, sending x to Ax, and this map is linear: it preserves addition and scalar multiplication. Every linear transformation of R^n can be represented this way. For example, the 2 × 2 matrix with rows (0, -1) and (1, 0) rotates every vector in the plane by 90 degrees counterclockwise, sending (1, 0) to (0, 1). Multiplying two transformation matrices produces a matrix for the combined transformation, applying the right-hand matrix first. This is why the order of multiplication matters: rotating then stretching is generally not the same as stretching then rotating.

### Inverses

A square matrix A is invertible if there is a matrix A^-1 with A A^-1 = A^-1 A = I. For a 2 × 2 matrix with rows (a, b) and (c, d), the inverse is 1/(ad - bc) times the matrix with rows (d, -b) and (-c, a), provided ad - bc is not zero. When A is invertible, the system Ax = b has exactly one solution, x = A^-1 b. A square matrix with no inverse is called singular.

## Determinants

### Computing Determinants

The determinant is a single number computed from a square matrix. For a 2 × 2 matrix with rows (a, b) and (c, d), the determinant is ad - bc. For the matrix with rows (3, 1) and (4, 2), the determinant is 3×2 - 1×4 = 2.

For a 3 × 3 matrix, one common method is cofactor expansion along the first row. Take the matrix with rows (2, 0, 1), (1, 3, 2) and (1, 1, 1). Expanding along the first row:

- 2 times the determinant of the minor with rows (3, 2) and (1, 1), which is 3 - 2 = 1, giving 2.
- minus 0 times its minor, giving 0.
- plus 1 times the determinant of the minor with rows (1, 3) and (1, 1), which is 1 - 3 = -2, giving -2.

The determinant is therefore 2 - 0 - 2 = 0. For large matrices, computers instead reduce the matrix to triangular form, because the determinant of a triangular matrix is simply the product of its diagonal entries.

### What the Determinant Means

Geometrically, the absolute value of a 2 × 2 determinant is the factor by which the transformation scales areas; in three dimensions it is the factor by which volumes are scaled. The matrix with rows (3, 1) and (4, 2) turns the unit square into a parallelogram of area 2. A negative determinant means the transformation also flips orientation, like a mirror reflection.

The single most useful fact about determinants is that a square matrix is invertible if and only if its determinant is nonzero. A zero determinant means the transformation squashes space into a lower dimension, for example flattening the plane onto a line, and such a squashing cannot be undone. The 3 × 3 matrix above, with determinant 0, is therefore singular.

Two other key properties are that det(AB) = det(A) × det(B), and that swapping two rows of a matrix changes the sign of its determinant.

## Linear Independence, Span and Basis

### Span

The span of a set of vectors is the set of all their linear combinations. The span of the single vector (1, 2) is a line through the origin. The span of (1, 0) and (0, 1) is the whole plane R^2.

### Linear Independence

Vectors v1, ..., vk are linearly independent if the only way to make c1v1 + ... + ckvk equal the zero vector is to choose every coefficient c equal to zero. If some nontrivial choice of coefficients gives zero, the vectors are linearly dependent, which means at least one of them can be written as a combination of the others and adds nothing new to the span.

Example: the vectors (1, 2) and (2, 4) are dependent, because 2 × (1, 2) - 1 × (2, 4) = (0, 0); the second is just twice the first. By contrast, (1, 2) and (3, 1) are independent. A quick test for n vectors in R^n is to place them as the columns of a square matrix: they are independent exactly when the determinant is nonzero. Here the determinant of the matrix with columns (1, 2) and (3, 1) is 1×1 - 3×2 = -5, which is not zero.

Any set of more than n vectors in R^n is automatically dependent; for instance, three vectors in the plane can never be independent.

### Basis, Dimension and Rank

A basis of a space is a set of vectors that is linearly independent and spans the space. Every basis of a given space has the same number of vectors, and that number is the dimension of the space. The standard basis of R^3 is (1, 0, 0), (0, 1, 0) and (0, 0, 1), so R^3 has dimension 3.

The rank of a matrix is the number of linearly independent columns it has, which always equals the number of linearly independent rows. An n × n matrix is invertible exactly when its rank is n, which is called full rank. The rank-nullity theorem states that for an m × n matrix, the rank plus the dimension of the null space (the set of solutions of Ax = 0) equals n, the number of columns.

## Eigenvalues and Eigenvectors

### Definition

For a square matrix A, a nonzero vector v is an eigenvector if multiplying by A only stretches or shrinks it without changing its line: Av = λv for some scalar λ, which is called the eigenvalue. The words come from the German "eigen", meaning "own" or "characteristic". Eigenvectors reveal the directions along which a transformation acts most simply.

### Finding Eigenvalues

Rewriting Av = λv as (A - λI)v = 0 shows that a nonzero solution exists only when A - λI is singular, that is, when det(A - λI) = 0. This equation is called the characteristic equation, and the left side is a polynomial in λ called the characteristic polynomial. An n × n matrix has a characteristic polynomial of degree n, and therefore at most n distinct eigenvalues.

### Worked Example

Let A have rows (4, 1) and (2, 3). Then A - λI has rows (4 - λ, 1) and (2, 3 - λ), and its determinant is (4 - λ)(3 - λ) - 2 = λ^2 - 7λ + 10. Factoring gives (λ - 5)(λ - 2) = 0, so the eigenvalues are λ = 5 and λ = 2.

For λ = 5, solve (A - 5I)v = 0. The first row gives -v1 + v2 = 0, so v2 = v1, and an eigenvector is (1, 1). Check: A(1, 1) = (4 + 1, 2 + 3) = (5, 5), which is 5 times (1, 1).

For λ = 2, the first row gives 2v1 + v2 = 0, so an eigenvector is (1, -2). Check: A(1, -2) = (4 - 2, 2 - 6) = (2, -4), which is 2 times (1, -2).

Two useful checks follow from general theorems: the sum of the eigenvalues equals the trace of the matrix (the sum of its diagonal entries), and their product equals the determinant. Here 5 + 2 = 7 = 4 + 3, and 5 × 2 = 10 = 4×3 - 1×2.

### Why Eigenvalues Matter

When a matrix has n independent eigenvectors, it can be diagonalised: written as A = PDP^-1, where the columns of P are the eigenvectors and D is a diagonal matrix of eigenvalues. This makes repeated multiplication easy, since A^k = PD^kP^-1 and raising a diagonal matrix to a power only requires raising each diagonal entry to that power. Real symmetric matrices are especially well behaved: the spectral theorem guarantees that their eigenvalues are all real and that their eigenvectors can be chosen to be mutually orthogonal.

Eigenvalues appear across science. In principal component analysis, the eigenvectors of a data set's covariance matrix give the directions of greatest variance. In mechanics, eigenvalues give the natural vibration frequencies of a structure. In Markov chains, the long-run steady state is an eigenvector with eigenvalue 1, the same idea behind PageRank's ranking of web pages. Not every real matrix has real eigenvalues, though: the 90-degree rotation matrix has eigenvalues i and -i, reflecting the fact that a rotation leaves no direction in the plane unchanged.
