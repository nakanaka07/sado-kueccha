import { FilterPanel } from "./components/FilterPanel";
import { LoadingScreen, MapLoadingOverlay } from "./components/LoadingScreen";
import { MapComponent } from "./components/Map";
import { useAppState } from "./hooks/useAppState";

function App() {
  const {
    loading,
    mapLoading,
    poisLoading,
    fadeOut,
    pois,
    filterState,
    handleMapLoaded,
    handleFilterChange,
  } = useAppState();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app">
      {mapLoading && <MapLoadingOverlay fadeOut={fadeOut} poisLoading={poisLoading} />}
      <main className="app-main">
        <MapComponent
          className="map-container"
          onMapLoaded={handleMapLoaded}
          enableClickableIcons={true}
          filterState={filterState}
          pois={pois}
          isPoisLoading={poisLoading}
        >
          <FilterPanel pois={pois} filterState={filterState} onFilterChange={handleFilterChange} />
        </MapComponent>
      </main>
    </div>
  );
}

export default App;
