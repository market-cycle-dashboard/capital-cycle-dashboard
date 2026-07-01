# VLCC data pipeline

`scripts/update-vlcc-data.mjs` is the single rebuild path for the VLCC page.

Inputs:

- `vlcc/snapshots/*.json`: immutable IMO-level snapshots.
- `data/vlcc/history-baselines.json`: pre-automation comparison points that are not full IMO snapshots.
- `data/vlcc/market.json`: market assumptions used by the profit scenario model.
- `data/vlcc/freight-rates.json`: public freight route quotes rendered as `vlcc/freight-rates.js`.
- Optional `data/vlcc/latest-observations.csv` or `.json`: newest public AIS observations to merge into a fresh snapshot.
- Optional `data/vlcc/dispatch-overrides.json`: manually calibrated dispatch rows with origin, destination, ETA, dispatch pool and yard/repair status. These rows are keyed by IMO and supplement the public AIS feed when the source identity is confirmed.
- Optional `VLCC_OBSERVATIONS_URL`: remote CSV/JSON observation feed used by GitHub Actions.

Outputs:

- `vlcc/snapshots/YYYY-MM-DD-HHmm.json`
- `vlcc/fleet-map-data.js`
- `vlcc/freight-rates.js`

The script recomputes load bands, commercial buckets, confidence, commercial rate, revenue rate and waiting counts from the same rules for every full snapshot, so the displayed time series stays comparable.

Dispatch overrides should be append-only by source date. Put rows without confirmed IMO into `unmatched` instead of guessing a vessel identity; they can be promoted once the Chinese/English name mapping is verified.
