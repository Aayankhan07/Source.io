# Hash Tables
--- Page 1 ---

## Introduction

A hash table, also called a hash map, is a data structure that stores key-value pairs and supports fast insertion, lookup, and deletion by key. It is the standard way to implement the abstract data type known as a dictionary, map, or associative array. Python's dict, Java's HashMap, C++'s std::unordered_map, and JavaScript's Map are all built on hash tables.

The central idea is simple. A hash table keeps an array of slots, often called buckets. To store a key, it computes an integer called a hash code from the key using a hash function, and then reduces that integer to an index in the array, commonly with the modulo operation: index = hash(key) mod m, where m is the number of buckets. The value is stored at that index. To look up the key later, the same calculation is repeated, leading straight back to the same bucket without scanning the entire collection.

When this works well, operations take constant time on average, written O(1). This is far faster than searching an unsorted list, which takes O(n) time, or a balanced binary search tree, which takes O(log n) time. The price is that hash tables do not keep keys in sorted order and may degrade to O(n) per operation in the worst case.

## A Brief History

The idea of hashing is usually credited to Hans Peter Luhn, an IBM researcher, who described it in an internal memorandum in January 1953. Around the same time, Gene Amdahl, Elaine McGraw, Nathaniel Rochester, and Arthur Samuel at IBM developed open addressing with linear probing for an assembler. The term "hashing" appeared in published literature in the late 1960s, and Donald Knuth's analysis of linear probing in 1963 is regarded as one of the first rigorous analyses of an algorithm's average-case performance.

## Hash Functions

### What a hash function does

A hash function maps keys of arbitrary type and size, such as strings, integers, or tuples, to fixed-size integers. A good hash function for a hash table has three main properties:

1. **Determinism**: the same key must always produce the same hash code. If a key's hash changed while it was stored, the table would no longer be able to find it. This is why mutable objects, such as Python lists, are not allowed as dictionary keys.
2. **Uniform distribution**: keys should be spread evenly across buckets, so that no bucket receives far more keys than others.
3. **Efficiency**: computing the hash should be fast, because it happens on every operation.

An important consistency rule links hashing with equality: if two keys are equal, they must have the same hash code. The reverse is not required; different keys can share a hash code. In Java, a class that overrides equals() must also override hashCode() to keep this contract.

--- Page 2 ---

### Common hashing techniques

- **Division method**: h(k) = k mod m. This is fast, but the choice of m matters. If m is a power of two, the result depends only on the lowest bits of the key, which can cause clustering when keys share patterns in those bits. Choosing m to be a prime number not close to a power of two is a classic recommendation.
- **Multiplication method**: multiply the key by a constant A between 0 and 1, take the fractional part, and multiply by m. Knuth suggested A approximately equal to (sqrt(5) - 1) / 2, about 0.618, the reciprocal of the golden ratio. This method works well even when m is a power of two.
- **Polynomial string hashing**: for a string, treat characters as coefficients of a polynomial evaluated at a fixed base. Java's String.hashCode, for example, uses a base of 31, computing s[0]*31^(n-1) + s[1]*31^(n-2) + ... + s[n-1] with integer overflow.
- **Universal hashing**: instead of one fixed function, choose a function at random from a carefully designed family. Introduced by J. Lawrence Carter and Mark Wegman in 1979, universal hashing guarantees that for any two distinct keys the probability of a collision is at most 1/m, regardless of the input.

### Cryptographic versus non-cryptographic hashes

Cryptographic hash functions such as SHA-256 are designed to make it infeasible to find two inputs with the same output or to reverse the hash. They are much slower than necessary for ordinary hash tables. Hash tables usually use fast non-cryptographic functions such as MurmurHash, FNV, xxHash, or SipHash. SipHash, designed in 2012 by Jean-Philippe Aumasson and Daniel J. Bernstein, is a keyed function that is fast yet resistant to "hash flooding" attacks, in which an attacker deliberately submits many keys that collide to slow a server down. Python, Rust, and Ruby have used SipHash or variants of it for this reason.

## Collisions

A collision occurs when two different keys map to the same bucket index. Collisions are unavoidable whenever the number of possible keys exceeds the number of buckets, by the pigeonhole principle. They are also more common than intuition suggests. The birthday paradox shows that with only 23 people, the probability that two share a birthday among 365 days exceeds 50 percent. Similarly, if n keys are inserted into m buckets, collisions become likely once n is roughly the square root of m. A hash table design therefore must include a collision resolution strategy. The two main families are separate chaining and open addressing.

--- Page 3 ---

## Separate Chaining

In separate chaining, each bucket holds a secondary data structure, traditionally a linked list, containing all entries whose keys hash to that bucket. To insert, the table hashes the key, goes to the bucket, and adds the entry to the list (after checking whether the key is already present, if keys must be unique). To search, it hashes the key and scans the list in that bucket, comparing keys with the equality test.

### Properties of chaining

- With a uniform hash function and n keys in m buckets, the average chain length is n/m. An unsuccessful search examines on average the whole chain, and a successful search examines about half of it, giving expected time O(1 + n/m).
- The table never "fills up": chains can grow indefinitely, so the load factor may exceed 1, although performance degrades as it does.
- Deletion is straightforward: remove the entry from its list.
- Linked lists have poor cache locality because nodes are scattered across memory, and each node needs extra space for a pointer.

Some implementations replace long chains with balanced trees. Since Java 8, Java's HashMap converts a bucket's linked list into a red-black tree when the bucket holds more than 8 entries (and the table has at least 64 buckets), improving the worst case for that bucket from O(n) to O(log n). When the bucket shrinks to 6 or fewer entries, it is converted back into a list.

## Open Addressing

In open addressing, all entries are stored directly in the bucket array itself, with at most one entry per slot. When a collision occurs, the table probes a sequence of other slots until it finds an empty one. Lookup follows the same probe sequence until it finds the key or reaches an empty slot, which proves the key is absent. Because every entry occupies a slot, the load factor can never exceed 1.

### Probing strategies

- **Linear probing**: try slots h(k), h(k)+1, h(k)+2, and so on, wrapping around the end of the array. It is very cache-friendly because it scans adjacent memory. Its weakness is primary clustering: occupied slots form long contiguous runs, and any key that hashes into a run must travel to its end, making the run even longer.
- **Quadratic probing**: try slots h(k) + c1*i + c2*i^2 for i = 0, 1, 2, and so on. This spreads probes out and avoids primary clustering, but keys with the same initial hash still follow the same probe sequence, a milder problem called secondary clustering. With poor parameter choices, quadratic probing may fail to find an empty slot even when one exists; using a prime table size and keeping the load factor below 0.5 guarantees success.
- **Double hashing**: use a second hash function to determine the step size, so the probe sequence is h1(k) + i*h2(k). Different keys with the same initial slot usually get different step sizes, which reduces both primary and secondary clustering. The value of h2(k) must never be zero and should be relatively prime to the table size so that every slot can be reached.

--- Page 4 ---

### Expected probe counts

Under the idealized assumption of uniform hashing, where each probe sequence is equally likely to be any permutation of slots, the expected number of probes in an unsuccessful search is at most 1/(1 - alpha), where alpha is the load factor. At alpha = 0.5 that is 2 probes, but at alpha = 0.9 it rises to 10 probes. For linear probing, Knuth showed the expected cost of an unsuccessful search is about (1/2)(1 + 1/(1 - alpha)^2), which grows to around 50 probes at alpha = 0.9. This is why open-addressing tables are kept relatively sparse.

### Deletion and tombstones

Deletion in open addressing is tricky. If an entry is simply cleared, later searches that pass through its slot would stop early and wrongly conclude that keys placed further along the probe sequence are missing. The usual solution is to replace the deleted entry with a special marker called a tombstone, also known as a "deleted" flag. Searches skip over tombstones, while insertions may reuse them. Too many tombstones slow searches down, so tables periodically rebuild themselves to clear them. For linear probing, an alternative is backward-shift deletion, which moves later entries in the cluster back to fill the gap.

### Advanced variants

- **Robin Hood hashing**, introduced by Pedro Celis in 1986, is a linear-probing variant. When inserting, if the new key has traveled farther from its home slot than the key currently occupying a slot, the two swap places. This "takes from the rich and gives to the poor," evening out probe lengths and reducing variance.
- **Cuckoo hashing**, introduced by Rasmus Pagh and Flemming Friche Rodler in 2001, uses two hash functions and two possible positions for each key. Lookups check at most two slots, so they are worst-case O(1). On insertion, if both positions are full, the new key evicts an occupant, which moves to its alternate position, possibly evicting another key, like a cuckoo chick pushing eggs out of a nest. If a cycle occurs, the table is rehashed.
- **Swiss tables**, developed at Google and released in the Abseil C++ library in 2017, store a small metadata byte per slot and use SIMD instructions to compare 16 slots' metadata at once.

## Load Factor

The load factor, written alpha, is the ratio of the number of stored entries n to the number of buckets m: alpha = n/m. It is the most important single number describing a hash table's performance. A higher load factor uses memory more efficiently but increases collisions and lengthens searches; a lower load factor wastes space but keeps operations fast.

Implementations choose a maximum load factor and resize when it is exceeded. Java's HashMap uses a default maximum load factor of 0.75 and a default initial capacity of 16 buckets, so the first resize happens when the 13th entry is inserted. CPython's dict resizes when it becomes two-thirds full. Open-addressing tables commonly keep alpha below about 0.5 to 0.7, while chaining tables tolerate values near or above 1.

--- Page 5 ---

## Resizing and Rehashing

When the load factor passes its threshold, the table allocates a larger array, typically double the size, and reinserts every existing entry. This process is called rehashing. Every entry must be rehashed because each key's index depends on m, so changing the number of buckets changes where keys belong.

A single resize costs O(n) time, which sounds expensive. However, because the size doubles each time, resizes become exponentially rarer as the table grows. If a table grows from 1 to n entries by doubling, the total work of all resizes is at most about 1 + 2 + 4 + ... + n, which is less than 2n. Spread over n insertions, this is O(1) per insertion. This kind of analysis is called amortized analysis, and the result is that insertion takes amortized O(1) time.

Growing by a constant factor is essential. If the table instead grew by a fixed number of slots, such as 100 at a time, the total resizing cost over n insertions would be O(n^2), and the amortized cost per insertion would be O(n).

Some tables also shrink when the load factor falls below a lower threshold, such as one quarter, to reclaim memory. The shrink threshold must be well below half of the grow threshold; otherwise a sequence of alternating insertions and deletions near the boundary could trigger repeated resizes, a problem known as thrashing.

For applications that cannot tolerate a pause, such as real-time systems, incremental resizing spreads the work out: the old and new arrays exist side by side, and each operation moves a few entries until the migration is finished. The Redis database uses this technique for its internal dictionaries.

## Complexity Summary

| Operation | Average case | Worst case |
|---|---|---|
| Search | O(1) | O(n) |
| Insert | O(1) amortized | O(n) |
| Delete | O(1) | O(n) |
| Space | O(n) | O(n) |

The worst case arises when many keys collide into the same bucket or cluster, either because of a poor hash function or an adversarial input. Average-case guarantees assume the hash function distributes keys roughly uniformly.

## Comparison with Other Structures

Hash tables are usually the fastest choice for exact-match lookups. Balanced binary search trees, such as red-black trees and AVL trees, offer O(log n) guaranteed time and support ordered operations like finding the minimum, iterating in sorted order, and range queries ("all keys between 10 and 20"), which hash tables cannot do efficiently. Arrays indexed directly by key, known as direct-address tables, give true O(1) worst-case access but are practical only when the key universe is small, such as the 256 possible byte values.
