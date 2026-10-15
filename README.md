# Boston Hub

Boston Hub is a small civic site for official City of Boston open data. It currently includes street cleaning schedules, restaurant health inspections, and trash and recycling days.

The canonical site is [https://boston-hub.vercel.app](https://boston-hub.vercel.app). Source: [github.com/robertfrontend/boston-data](https://github.com/robertfrontend/boston-data).

## Tools

- **Boston Sweeper** (`/boston-sweeper`) looks up a street in the city sweeping schedule, including sides other than odd/even. It shows the next real sweeping date (season, weekday, and week of the month) and downloads an `.ics` file with an `America/New_York` timezone. The map uses Leaflet and OpenStreetMap. Geocoding goes through Nominatim, with Photon as a fallback, so no paid map key is required.
- **Food Inspections** (`/food-inspections`) searches Analyze Boston health inspections. Featured results skip missing dates and show the latest result for each restaurant. Enter uses the same case-insensitive partial match as the suggestions.
- **Trash Day** (`/trash-day`) looks up trash and recycling days for a Boston address.

## Stack

- Next.js (App Router) and React
- TypeScript
- Tailwind CSS
- Leaflet and react-leaflet
- Papa Parse for the sweeping CSV
- [Analyze Boston](https://data.boston.gov/)

## Getting started

```bash
git clone https://github.com/robertfrontend/boston-data.git
cd boston-data
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables are required.

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Street sweeping data

`public/data/street-sweeping-schedules.csv` is a snapshot of the Analyze Boston [Street Sweeping Schedules](https://data.boston.gov/dataset/street-sweeping-schedules) dataset (resource `9fdbdcad-67c8-4b23-b6ec-861e77d56227`). The file in this repo was ingested on 2026-03-27.

To refresh it, download that CSV again and replace `public/data/street-sweeping-schedules.csv`. See `public/data/street-sweeping-schedules.txt` for the same note.

Posted street signs are the legal record. This app only reads the published schedule.

## Season rules

- Most districts: April 1 through November 30
- North End, South End, Beacon Hill, and rows marked `north_end_pilot`: March 1 through December 31
- `year_round`: no seasonal gap

Weeks of the month follow the city's blocks: days 1–7, 8–14, 15–21, 22–28, and 29–31. For a given weekday that is the same as the 1st through 5th occurrence of that weekday.

## License

MIT. See [LICENSE](LICENSE).
