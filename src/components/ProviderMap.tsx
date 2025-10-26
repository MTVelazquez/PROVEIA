import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

// Extend Leaflet types for markerClusterGroup
declare module 'leaflet' {
  function markerClusterGroup(options?: any): L.MarkerClusterGroup;
  
  interface MarkerClusterGroup extends L.LayerGroup {
    clearLayers(): this;
  }
}

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Provider {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  score?: number;
  location_name: string;
  address?: string;
}

interface ProviderMapProps {
  providers: Provider[];
  center?: [number, number];
  zoom?: number;
}

export const ProviderMap = ({ 
  providers, 
  center = [23.6345, -102.5528], 
  zoom = 5 
}: ProviderMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const clusterLayer = useRef<L.MarkerClusterGroup | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) {
      console.log('ProviderMap: mapRef not ready');
      return;
    }
    
    if (mapInstance.current) {
      console.log('ProviderMap: map already initialized');
      return;
    }

    console.log('ProviderMap: Initializing map container...');

    try {
      // Create map instance
      mapInstance.current = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: true,
      });

      console.log('ProviderMap: Map instance created');

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapInstance.current);

      console.log('ProviderMap: Tile layer added');

      // Initialize marker cluster group
      clusterLayer.current = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
      });
      
      mapInstance.current.addLayer(clusterLayer.current);
      console.log('ProviderMap: Cluster layer added');

      // Force map to invalidate size
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
          console.log('ProviderMap: Size invalidated');
        }
      }, 100);

    } catch (error) {
      console.error('ProviderMap: Error initializing map:', error);
    }

    // Cleanup
    return () => {
      console.log('ProviderMap: Cleaning up map');
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []); // Only run once

  // Update markers when providers change
  useEffect(() => {
    if (!mapInstance.current || !clusterLayer.current) {
      console.log('ProviderMap: Map or cluster not ready for markers');
      return;
    }

    if (!providers || providers.length === 0) {
      console.log('ProviderMap: No providers to display');
      clusterLayer.current.clearLayers();
      return;
    }

    console.log(`ProviderMap: Adding ${providers.length} markers to map`);

    // Clear existing markers
    clusterLayer.current.clearLayers();

    const bounds: L.LatLngTuple[] = [];

    // Add markers for each provider
    providers.forEach((provider, index) => {
      const lat = provider.latitude;
      const lon = provider.longitude;

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        console.warn(`ProviderMap: Invalid coordinates for provider ${provider.name}`);
        return;
      }

      const name = provider.name || "(Sin nombre)";
      const location = provider.location_name || "";
      const address = provider.address || "";
      const score = Math.round(provider.score || 0);
      
      // Determine marker color based on score
      let color = "#e74c3c"; // red
      if (score >= 70) color = "#2ecc71"; // green
      else if (score >= 40) color = "#f1c40f"; // yellow

      // Create custom icon
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 12],
      });

      // Badge color class
      let scoreClass = "bg-red-500 text-white";
      if (score >= 70) scoreClass = "bg-green-500 text-white";
      else if (score >= 40) scoreClass = "bg-yellow-500 text-black";

      // Create popup content
      const popupContent = `
        <div style="font-size: 13px; font-family: system-ui, -apple-system;">
          <strong style="color: #11386E;">${name}</strong><br/>
          ${address ? `${address}<br/>` : ''}
          ${location ? `<span style="color: #11386E99;">${location}</span><br/>` : ''}
          <span class="inline-block px-2 py-1 rounded-full text-xs font-bold mt-1 ${scoreClass}" style="border-radius: 999px; padding: 2px 8px; margin-top: 4px;">
            Score: ${score}
          </span>
        </div>
      `;

      // Create marker
      const marker = L.marker([lat, lon], { icon });
      marker.bindPopup(popupContent);
      
      // Add to cluster layer
      clusterLayer.current!.addLayer(marker);
      bounds.push([lat, lon]);

      console.log(`ProviderMap: Added marker ${index + 1} for ${name}`);
    });

    // Fit bounds to show all markers
    if (bounds.length > 0) {
      try {
        mapInstance.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
        });
        console.log(`ProviderMap: Fitted bounds to ${bounds.length} markers`);
      } catch (error) {
        console.error('ProviderMap: Error fitting bounds:', error);
      }
    }
  }, [providers]);

  if (!providers || providers.length === 0) {
    return (
      <div className="w-full rounded-xl overflow-hidden border border-border/40 flex items-center justify-center bg-secondary/20" style={{ height: '400px' }}>
        <p className="text-muted-foreground text-sm">No hay proveedores para mostrar en el mapa</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border/40 bg-background relative z-0" style={{ height: '400px' }}>
      <div 
        ref={mapRef} 
        className="w-full h-full relative z-0" 
        style={{ height: '400px', minHeight: '400px' }}
      />
    </div>
  );
};
