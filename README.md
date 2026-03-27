# 🧹 Boston Sweeper

**Boston Sweeper** is a premium, real-time web application designed to help Boston residents and visitors avoid parking tickets by providing instant access to official street cleaning schedules. 

Built with a focus on user experience and speed, it features an elegant **Apple-inspired UI** and integrates directly with official municipal data.

[![GitHub license](https://img.shields.io/github/license/robertfrontend/boston-street-cleaning)](https://github.com/robertfrontend/boston-street-cleaning/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/robertfrontend/boston-street-cleaning)](https://github.com/robertfrontend/boston-street-cleaning/stargazers)

---

## ✨ Key Features

-   **🎯 Real-time Street Search**: Integrated with the official **Boston SAM (Street Address Management) API** to provide autocomplete for every single street in the city.
-   **📍 Precision Geolocation**: One-tap "Locate Me" button that uses browser geolocation and Google Geocoding to automatically detect your current street.
-   **❄️ Winter Season Intelligence**: Automatically detects if a street is currently in cleaning season (e.g., April-Nov for general neighborhoods vs March-Dec for North/South End).
-   **📅 Detailed Calendar**: Visual breakdown of cleaning days (Mon-Sun) and specific weeks of the month (1st-5th).
-   **🗺️ Interactive Route Maps**: Visualizes the specific block segments on an interactive map using Google Maps API.
-   **📱 Apple Design Pattern**: A clean, modern interface following iOS/macOS Human Interface Guidelines, featuring glassmorphism and intuitive segmented controls.
-   **🕒 12h Format Support**: All cleaning hours are automatically formatted to 12-hour (AM/PM) for easier reading.

---

## 🚀 Tech Stack

-   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (with Glassmorphism)
-   **Maps/Geocoding**: [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/)
-   **Data Processing**: [PapaParse](https://www.papaparse.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **API**: [Analyze Boston Open Data](https://data.boston.gov/)

---

## 🛠️ Getting Started

### Prerequisites

-   Node.js (Latest LTS recommended)
-   A Google Maps API Key (with Maps JavaScript API and Geocoding API enabled)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/robertfrontend/boston-street-cleaning.git
    cd boston-street-cleaning
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Data Sources

This application uses official data provided by the City of Boston:
-   **Street Sweeping Schedules**: Municipal dataset for cleaning times and rules.
-   **SAM Street Segments**: Master database for all official street names and segments.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👤 Author

**Robert Frontend**
-   GitHub: [@robertfrontend](https://github.com/robertfrontend)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Disclaimer: This app is a tool to help you find schedules. Always check the posted street signs, as they are the final legal authority for parking enforcement in Boston.*
