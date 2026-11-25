# Hypothesis Testing: A Practical Introduction
--- Page 1 ---

## 1. What Hypothesis Testing Is For

Hypothesis testing is a formal procedure for deciding whether the data collected from a sample provide enough evidence to reject a claim about a population. Researchers rarely have access to an entire population, so they draw a sample, compute a summary statistic, and ask whether the value they observed could reasonably have arisen by chance alone. The framework used in most introductory courses combines ideas from Ronald Fisher, who popularized the p-value in the 1920s, and from Jerzy Neyman and Egon Pearson, who introduced fixed error rates and the concept of power in the late 1920s and 1930s.

The basic logic resembles a criminal trial. The defendant is presumed innocent until the evidence is strong enough to conclude otherwise. In statistics, the "presumption of innocence" is the null hypothesis, and the evidence is the sample data. A verdict of "not guilty" does not prove innocence; similarly, failing to reject the null hypothesis does not prove that the null hypothesis is true.

## 2. Null and Alternative Hypotheses

Every test begins with two competing statements about a population parameter, such as a mean (μ), a proportion (p), or a difference between two means.

### 2.1 The null hypothesis (H0)

The null hypothesis is the default claim of no effect, no difference, or no change. It always contains an equality, for example H0: μ = 100. The null hypothesis is the statement that the test tries to find evidence against. All probability calculations in a test are performed under the assumption that H0 is true.

### 2.2 The alternative hypothesis (H1 or Ha)

The alternative hypothesis is what the researcher suspects might be true instead. It never contains an equality. It can take one of three forms:

- **Two-sided (two-tailed):** H1: μ ≠ 100. Used when a departure in either direction matters.
- **Right-tailed (one-sided):** H1: μ > 100. Used when only an increase is of interest.
- **Left-tailed (one-sided):** H1: μ < 100. Used when only a decrease is of interest.

The choice between one-sided and two-sided alternatives must be made before looking at the data. Choosing a one-sided test after seeing which direction the sample went is a form of data snooping that effectively doubles the false-positive rate.

## 3. Test Statistics and Sampling Distributions

A test statistic is a single number computed from the sample that measures how far the observed data fall from what the null hypothesis predicts, expressed in units of standard error. The general pattern is:

test statistic = (observed estimate − hypothesized value) / standard error

For a mean with known population standard deviation σ, the statistic is z = (x̄ − μ0) / (σ / √n), which follows the standard normal distribution when H0 is true. When σ is unknown and must be estimated by the sample standard deviation s, the statistic becomes t = (x̄ − μ0) / (s / √n), which follows a t-distribution with n − 1 degrees of freedom.

--- Page 2 ---

## 4. P-Values

The p-value is the probability, computed assuming the null hypothesis is true, of obtaining a test statistic at least as extreme as the one actually observed. "Extreme" is defined by the alternative hypothesis: for a right-tailed test it means values at least as large, for a left-tailed test values at least as small, and for a two-sided test values at least as far from zero in either direction.

A small p-value means that the observed data would be surprising if H0 were true. It is therefore treated as evidence against H0. A large p-value means the data are consistent with H0, though they may also be consistent with many other hypotheses.

### 4.1 Common misinterpretations

The p-value is one of the most misunderstood quantities in science. In 2016 the American Statistical Association issued a formal statement listing six principles about p-values, partly to address widespread misuse. Key points to remember:

- The p-value is **not** the probability that the null hypothesis is true.
- The p-value is **not** the probability that the result occurred "by chance."
- A p-value does not measure the size or practical importance of an effect. A tiny, trivial difference can produce a very small p-value if the sample is large enough.
- A p-value of 0.06 is not meaningfully different from a p-value of 0.04, even though one falls on each side of the conventional 0.05 cutoff.

## 5. Significance Level and Decision Rules

The significance level, written α (alpha), is the threshold chosen before the study for deciding when evidence is strong enough to reject H0. The most common value is α = 0.05, a convention traced to Fisher's writing, though fields use other values: particle physics requires a "five sigma" result, corresponding to a one-sided p-value of roughly 3 in 10 million, before announcing a discovery.

The decision rule is simple:

- If p ≤ α, reject H0. The result is called "statistically significant."
- If p > α, fail to reject H0. Note the careful wording: we never "accept" the null.

An equivalent approach uses critical values. For a two-sided z-test at α = 0.05, the critical values are ±1.96, because 2.5% of the standard normal distribution lies beyond each of those points. Any test statistic falling in the rejection region beyond those bounds leads to rejection of H0. For a one-sided z-test at α = 0.05, the critical value is 1.645.

There is also a direct connection with confidence intervals. A two-sided test at level α rejects H0: μ = μ0 exactly when μ0 lies outside the (1 − α) confidence interval for μ. So a 95% confidence interval that excludes 100 corresponds to rejecting H0: μ = 100 at the 0.05 level.

--- Page 3 ---

## 6. Type I and Type II Errors

Because decisions are based on samples, mistakes are always possible. There are exactly two kinds of error.

| Decision | H0 actually true | H0 actually false |
|---|---|---|
| Reject H0 | Type I error (false positive) | Correct decision (power) |
| Fail to reject H0 | Correct decision | Type II error (false negative) |

### 6.1 Type I error

A Type I error occurs when the test rejects a null hypothesis that is actually true. The probability of a Type I error equals the significance level α. Setting α = 0.05 means that, in the long run, 5% of tests on true null hypotheses will produce false alarms. In a medical screening analogy, a Type I error is telling a healthy patient they have a disease.

### 6.2 Type II error

A Type II error occurs when the test fails to reject a null hypothesis that is actually false. Its probability is denoted β (beta). In the medical analogy, a Type II error is telling a sick patient they are healthy. Unlike α, β is not set directly by the researcher; it depends on the true effect size, the sample size, the variability of the data, and α itself.

### 6.3 The trade-off

For a fixed sample size, lowering α to reduce false positives makes the rejection region smaller, which increases β. The only way to reduce both error rates simultaneously is to collect more data or to reduce measurement noise.

## 7. Statistical Power

The power of a test is the probability of correctly rejecting H0 when a specific alternative is true. Power equals 1 − β. A widely used target, recommended by the psychologist Jacob Cohen, is power of 0.80, meaning the study has an 80% chance of detecting the effect if it truly exists.

Four factors determine power:

1. **Effect size.** Larger true differences are easier to detect. Cohen's d, the difference in means divided by the standard deviation, is a common standardized measure; Cohen labeled d = 0.2 small, 0.5 medium, and 0.8 large.
2. **Sample size.** Power increases as n increases, because the standard error shrinks in proportion to 1/√n.
3. **Significance level.** A larger α (for example 0.10 instead of 0.05) increases power but also increases Type I errors.
4. **Variability.** Less noise in the measurements raises power.

A power analysis performed before data collection tells researchers how large a sample they need. As a rough benchmark, a two-sample t-test needs about 64 participants per group to achieve 80% power for a medium effect (d = 0.5) at α = 0.05, two-sided. Underpowered studies are a major reason why published findings sometimes fail to replicate.

--- Page 4 ---

## 8. The t-Test Family

The t-distribution was published in 1908 by William Sealy Gosset, a chemist at the Guinness brewery in Dublin who wrote under the pen name "Student" because his employer restricted staff publications. For that reason the distribution is still called Student's t. It looks like the normal curve but has heavier tails, reflecting extra uncertainty from estimating σ. As degrees of freedom grow, the t-distribution approaches the standard normal; by about 30 degrees of freedom the two are close.

### 8.1 One-sample t-test

Compares a single sample mean with a hypothesized value μ0. Degrees of freedom are n − 1.

### 8.2 Independent two-sample t-test

Compares the means of two unrelated groups, such as a treatment group and a control group. The classic pooled version assumes equal variances and uses n1 + n2 − 2 degrees of freedom. Welch's t-test drops the equal-variance assumption and uses an adjusted degrees-of-freedom formula; many statisticians now recommend Welch's version as the default.

### 8.3 Paired t-test

Used when each observation in one group is matched with one in the other, such as before-and-after measurements on the same people. The test computes the difference for each pair and then performs a one-sample t-test on those differences against zero.

### 8.4 Assumptions

t-tests assume that observations are independent, that data are measured on an interval or ratio scale, and that the sampling distribution of the mean is approximately normal. Thanks to the central limit theorem, the normality requirement becomes less critical as sample size grows; a common rule of thumb treats n ≥ 30 as large enough for moderate skewness. When assumptions are badly violated, nonparametric alternatives such as the Wilcoxon signed-rank test or the Mann-Whitney U test can be used.

## 9. Worked Example: A Battery Lifetime Claim

A manufacturer claims that its AA batteries last an average of 20 hours in a standard test device. A consumer group suspects the true average is lower. They test a random sample of n = 16 batteries and find a sample mean of x̄ = 18.9 hours with a sample standard deviation of s = 2.4 hours.

### Step 1: State the hypotheses

H0: μ = 20 hours. H1: μ < 20 hours (a left-tailed test, since only a shortfall matters to the consumer group).

### Step 2: Choose the significance level

α = 0.05, chosen before examining the data.

### Step 3: Check conditions

The batteries were randomly sampled, so independence is reasonable. A plot of the 16 lifetimes shows no strong skew or outliers, so a t-test is appropriate.

--- Page 5 ---

### Step 4: Compute the test statistic

The standard error is s / √n = 2.4 / √16 = 2.4 / 4 = 0.6 hours.

t = (18.9 − 20) / 0.6 = −1.1 / 0.6 ≈ −1.83, with 15 degrees of freedom.

### Step 5: Find the p-value

For a left-tailed test with 15 degrees of freedom, the probability of a t value of −1.83 or lower is approximately 0.044. Equivalently, the critical value for a one-sided test at α = 0.05 with 15 degrees of freedom is about −1.753, and −1.83 lies beyond it.

### Step 6: Make a decision and state a conclusion

Since 0.044 ≤ 0.05, the consumer group rejects H0. In context: at the 5% significance level, the sample provides evidence that the mean battery lifetime is less than the claimed 20 hours.

### Step 7: Reflect on the result

Notice how fragile this conclusion is. Had the group chosen a two-sided test, the p-value would have doubled to about 0.088, and they would have failed to reject H0. The estimated shortfall of 1.1 hours corresponds to an effect size of about d = 1.1 / 2.4 ≈ 0.46, a medium effect by Cohen's labels. With only 16 batteries, the study had modest power, so a replication with a larger sample would strengthen confidence in the finding. Reporting a confidence interval for μ alongside the p-value would also show readers the plausible range of true average lifetimes.

## 10. Multiple Testing and Good Practice

When many tests are run on the same data, the chance of at least one false positive grows quickly. With 20 independent tests of true null hypotheses at α = 0.05, the probability of at least one significant result is about 64%. The Bonferroni correction controls this by testing each of m hypotheses at α / m; with 20 tests, each would need p ≤ 0.0025. Less conservative procedures, such as the Benjamini-Hochberg method for controlling the false discovery rate, are popular in genomics and other fields that run thousands of tests.

Good practice in hypothesis testing includes:

- Pre-registering hypotheses, the test to be used, and the sample size before collecting data.
- Reporting exact p-values rather than only "p < 0.05."
- Reporting effect sizes and confidence intervals so readers can judge practical importance.
- Distinguishing statistical significance from practical significance.
- Avoiding "p-hacking," the practice of trying many analyses until one crosses the significance threshold.

## 11. Summary

Hypothesis testing compares the observed data with what would be expected if a null hypothesis were true. The p-value quantifies how surprising the data are under H0, and the significance level α sets the cutoff for rejection. Type I errors occur with probability α, Type II errors with probability β, and power equals 1 − β. The t-test, introduced by Gosset under the name Student, handles the common case of an unknown population standard deviation. Used carefully, with attention to effect sizes, power, and multiple comparisons, hypothesis tests are a valuable tool for drawing conclusions from limited data.
