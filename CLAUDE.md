# Coding Standards & Guidelines

This file governs all code written in this project. Follow these rules without exception.

---

## Architecture

- **High cohesion, low coupling.** Each module has one clear responsibility. Functions and modules that change together live together; functions and modules that do not change together are separated.
- **Directed dependency hierarchy.** Dependencies flow one way: no circular imports, no coupling between sibling modules except through a shared interface.
- **Few top-level components.** Minimise the number of modules at each layer. A flat, wide structure is harder to navigate than a shallow hierarchy with clear boundaries.
- **Module size limit: 400 lines.** If a module exceeds this, it is doing too much. Extract cohesive sub-functionality into a dedicated module.
- **No premature generalisation.** Solve the problem in front of you. Do not add abstractions, base classes, or configuration knobs for requirements that do not yet exist.

---

## Functions

- **One level of abstraction per function.** A function that does high-level orchestration delegates all detail to sub-functions. A function that does low-level computation does not also orchestrate.
- **Extract cohesive sub-functionality into named sub-functions.** If a block of code inside a function deserves a comment to explain what it does, it deserves a name and a function boundary instead.
- **Short functions.** A function that does not fit on one screen is too long.
- **No side effects unless the function name says so.** `compute_*` and `get_*` are pure. `store_*`, `update_*`, and `create_*` have side effects.

---

## Naming

- **Names must be precise and short.** A long identifier is a sign the concept is not well understood.
- **No abbreviations** unless the abbreviation is universally understood in this domain (e.g. `atr`, `rsi`, `ohlc`, `sr`, `vwap`).
- **No redundant context in names.** If the module is `vwap`, the function is `compute_bands`, not `compute_vwap_bands`.

---

## Constants

- **No magic constants.** Every numeric or string literal that encodes a domain decision belongs in a named constant at the top of the module or in a dedicated `constants.py`.
- **Name constants for what they mean, not what they are.** `MIN_BARS_BETWEEN_PIVOTS = 5`, not `FIVE`.

---

## Comments

- **No bad comments.** Do not state what the code does; state why it does it if the reason is not obvious.
- **No commented-out code.** Dead code goes in version control history, not in the file.
- **No dead code.** Unused functions, unused imports, unreachable branches — delete them.

---

## Error Handling

- **No swallowed exceptions.** Catching an exception and doing nothing (or only logging) is only acceptable if you explicitly document why silence is correct.
- **Let exceptions propagate** to the boundary where they can be meaningfully handled. Do not catch `Exception` broadly inside library code.
- **Fail loudly at invalid inputs.** Use `assert` or raise `ValueError`/`TypeError` with a descriptive message at function entry when preconditions are violated.

---

## Testing

### Philosophy

- **Tests are first-class code.** They live in `tests/`, are subject to the same quality standards as production code, and are committed with the feature they test.
- **Testing shows presence of defects, not absence.** A passing test suite is not a proof of correctness. Design tests to find bugs, not to confirm the code runs.
- **Exhaustive testing is impossible.** Apply risk-based prioritisation: identify the modules most likely to fail and concentrate effort there. 80% of defects cluster in 20% of the code.
- **Test early, test often.** Write tests before or alongside the code they cover, not after.

### What to test

- **All non-trivial logic must have an automated test.** If a function makes a decision, branches on data, or computes a non-obvious result, it is tested.
- **Trivial code (field access, pass-through delegation) does not need a dedicated test.**
- **Prioritise high-risk modules.** Signal detection, scoring formulas, zone merging, and Bayesian updates are high risk. Database plumbing is lower risk.
- **Representative sample over exhaustive coverage.** Choose test cases that cover:
  - The normal / expected path
  - Boundary conditions (empty input, single element, maximum values)
  - Known failure modes (no matching zone, expired trigger, NaN in price series)

### How to write tests

- **One behaviour per test function.** A test that checks multiple independent behaviours hides which one failed.
- **Test names describe the scenario and expected outcome.** `test_identify_sr_zones_returns_empty_when_no_pivots` not `test_sr_zones_1`.
- **No logic in tests.** Loops, conditionals, and complex setup inside a test make it untrustworthy. Use parametrize (`@pytest.mark.parametrize`) for multiple cases.
- **Fixtures for shared setup.** If three tests need the same DataFrame, put it in a pytest fixture, not copy-pasted in each test body.
- **Do not mock unless crossing a real boundary** (database, network, filesystem). Mock `psycopg2` connections; do not mock internal helper functions.

---

## Windows Shell Notes

- **`pkill` does not reliably terminate processes on Windows.** To stop a background server, use `taskkill //F //PID <pid>` with the PID captured from the startup log. Use `wmic process where "name='python.exe'" get processid,commandline` to find the right PID if it was not captured.

---

## Project-Specific Conventions

- **DataFrames are Polars** unless a library requires pandas (e.g. `pandas-ta`). Convert at the boundary; do not pass pandas DataFrames through internal APIs.
- **Database access only in `db.py`, `schema.py`, `ingestion/collector.py`, `ingestion/storage.py`, `queries.py`, `ingestion/live.py`, `vwap.py`, `zones/store.py`, `dashboard/api.py`, `execution/journal.py`, and `execution/daily_stats.py`.** Signal detection, scanning, and cross-asset conditioning modules receive data as Polars DataFrames; they do not hold DB connections.
- **Timestamps are always timezone-aware UTC** inside the system. Convert to CET only at display boundaries.
- **All signal scoring weights are named constants**, not inline floats.
- **Indicators are hand-rolled in Polars** (no external TA libraries). Wilder's smoothing for RSI/ATR, standard EMA for MACD. `adjust=False` throughout.
- **S/R zones use Beta distribution** for bounce probability: alpha (bounces + 1.0 prior), beta (penetrations + 1.0 prior). Posterior = alpha/(alpha+beta).
- **Session timing uses `zoneinfo.ZoneInfo("Europe/Berlin")`** for CET/CEST. Trading window: 09:15–17:00 CET.

---

## Strategy Notes

The `strategy_notes/` folder documents findings about each strategy — why it works, why it fails, paper vs implementation mismatches, parameter sensitivity, and lessons learned. One file per strategy (e.g. `citsm.md`, `bb_squeeze.md`).

**When to update:** After any backtest analysis, A/B comparison, or investigation that reveals something meaningful about a strategy's behaviour. If a strategy is disabled, underperforms expectations, or has known limitations, document it here. Keep notes concise and evidence-based.
