# Retrieval eval: hash

- Embedder: legacy FNV-1a hashed unigram+bigram, 768 dims (offline)
- Date: 2026-11-25T22:46:51.288Z
- 20 documents, 257 chunks (chunking.ts), 63 questions, 26 paraphrased
- Gate: Recall@6 (corpus scope) = 0.476 vs MIN_RECALL6 0.8 -> FAIL

| Scope | Subset | n | Recall@1 | Recall@3 | Recall@6 | MRR |
|---|---|---|---|---|---|---|
| doc | all | 63 | 0.413 | 0.635 | 0.794 | 0.559 |
| doc | literal | 37 | 0.622 | 0.838 | 0.919 | 0.734 |
| doc | paraphrase | 26 | 0.115 | 0.346 | 0.615 | 0.309 |
| corpus | all | 63 | 0.317 | 0.397 | 0.476 | 0.382 |
| corpus | literal | 37 | 0.514 | 0.649 | 0.703 | 0.592 |
| corpus | paraphrase | 26 | 0.038 | 0.038 | 0.154 | 0.082 |

## Misses at top-6 (corpus scope): 33

- [paraphrase] cell-respiration: Which researcher's hypothesis explained how a hydrogen-ion imbalance across a membrane drives energy capture, and when was it put forward? (rank 174)
- [paraphrase] cell-respiration: How does a gas found in car exhaust stop a cell from producing usable energy? (rank 213)
- [paraphrase] industrial-revolution: How much more fuel-efficient was the Glasgow instrument maker's improved design than the earlier atmospheric pumping machine? (rank 43)
- [paraphrase] contract-formation: If someone agrees to a deal by mailing a reply, at what moment does the agreement become binding? (rank 20)
- [literal] contract-formation: When does the doctrine of undue influence apply? (rank 71)
- [literal] hash-tables: Who is credited with the original idea of hashing? (rank 66)
- [paraphrase] hash-tables: Which well-known in-memory key-value store migrates entries gradually while growing so that it avoids long pauses? (rank 113)
- [paraphrase] hypothesis-testing: Which statistician made the widely used measure of how surprising data are popular, and in which decade? (rank 206)
- [paraphrase] chemical-equilibrium: Which two Scandinavian scientists first formulated the rule about concentration ratios at balance, and in what year? (rank 9)
- [paraphrase] chemical-equilibrium: What fraction of the starting gases becomes fertilizer feedstock each time they flow once through the vessel? (rank 72)
- [literal] newtonian-mechanics: According to Galileo's rolling-ball argument, what would happen to a ball on a perfectly smooth horizontal surface? (rank 10)
- [paraphrase] newtonian-mechanics: Why does extending the duration of a crash reduce the harm done to the occupants? (rank 210)
- [literal] newtonian-mechanics: In the perfectly inelastic rear-end collision example, how much of the original kinetic energy was lost? (rank 10)
- [paraphrase] cardiovascular-physiology: Which cluster of cells sets the tempo of each beat, and how often does it fire while a person is relaxing? (rank 81)
- [paraphrase] plate-tectonics: Why was the early twentieth-century notion of wandering landmasses ignored by most scientists for many years? (rank 36)
- [paraphrase] memory-and-learning: Which method revealed that a flashed display is momentarily held almost in full by the visual system? (rank 231)
- [paraphrase] memory-and-learning: After seven days, how did pupils who quizzed themselves compare with those who simply reread the passages? (rank 210)
- [literal] tcp-ip-networking: How many addresses are usable for hosts in a /24 IPv4 block, and which addresses are reserved? (rank 14)
- [paraphrase] linear-algebra-basics: How can you tell from a single number whether a square array of numbers can be undone or reversed? (rank 22)
- [literal] linear-algebra-basics: What are the eigenvalues of the matrix with rows (4, 1) and (2, 3)? (rank 21)
- [literal] ethical-theories: Which thought experiment asks whether you would plug into a device that simulates a pleasant life? (rank 9)
- [paraphrase] ethical-theories: Why would Kant say it is wrong to borrow money while secretly planning never to pay it back? (rank 11)
- [literal] ethical-theories: According to Rawls, when are social and economic inequalities permitted? (rank 135)
- [paraphrase] human-nutrition: Which of the main food components packs the most calories into each unit of weight? (rank 185)
- [paraphrase] human-nutrition: What do microbes in the lower bowel make when they break down roughage, and what does it feed? (rank 26)
- [paraphrase] ecology-course-reader: What ground condition in the treeless far-northern landscape keeps plant roots shallow? (rank 177)
- [literal] ecology-course-reader: How many birds were translocated to the Illinois greater prairie chicken population, and from which states? (rank 88)
- [paraphrase] stellar-evolution: What is the heaviest that a dense, Earth-sized stellar corpse can get before the quantum resistance of its particles gives way? (rank 75)
- [literal] stellar-evolution: Who discovered the first pulsar and in what year? (rank 70)
- [paraphrase] music-theory-fundamentals: How do you locate the darker-sounding companion that uses exactly the same sharps-and-flats pattern as a given bright-sounding tonality? (rank 161)
- [paraphrase] music-theory-fundamentals: Which phrase ending, linked to the closing word of church hymns, moves from the fourth-degree harmony to home? (rank 132)
- [paraphrase] separation-of-powers: According to the 1748 French thinker, what happens to freedom when a single authority combines several governmental functions? (rank 16)
- [literal] separation-of-powers: How does a unitary system differ from a federal system in where ultimate authority lies? (rank 16)
