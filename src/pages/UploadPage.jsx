import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 15);
    },
  });

  useEffect(() => {
    if (position && position.lat && position.lng) {
      map.flyTo(position, 15);
    }
  }, [position?.lat, position?.lng, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

const UploadPage = () => {
  const [profile, setProfile] = useState(null);
  const [file, setFile] = useState(null);
  const [typeOfWaste, setTypeOfWaste] = useState('Plastic'); // Default
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [description, setDescription] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      // Set to user object directly to prevent issues if profile row isn't fully ready
      setProfile(user);
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5`);
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
             const formatted = data.features.map((f, i) => {
               const p = f.properties;
               const parts = [];
               if (p.name) parts.push(p.name);
               if (p.street) parts.push(p.street);
               if (p.city || p.town || p.village) parts.push(p.city || p.town || p.village);
               if (p.state) parts.push(p.state);
               return {
                 id: i,
                 display_name: parts.join(', '),
                 lat: f.geometry.coordinates[1],
                 lon: f.geometry.coordinates[0]
               };
             });
             setSuggestions(formatted);
          } else {
             setSuggestions([]);
          }
        } catch (e) {
          console.error("Geocoding error", e);
        }
      } else {
        setSuggestions([]);
      }
    }, 600); // 600ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setLocation(val);
    setSearchQuery(val);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          if (!location) setLocation(`GPS Coordinates: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Could not get GPS location. Please allow location access in your browser settings.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!file) {
      setErrorMsg("Please select an image of the waste.");
      setLoading(false);
      return;
    }
    
    if (!profile) {
      setErrorMsg("Auth error. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      // 1. Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('waste-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('waste-images')
        .getPublicUrl(filePath);

      // 2. Insert record into reports table
      const { error: dbError } = await supabase.from('reports').insert([
        {
          citizen_id: profile.id,
          status: 'pending',
          weight_kg: estimatedWeight ? Number(estimatedWeight) : null,
          type_of_waste: typeOfWaste,
          image_url: publicUrl,
          location: location,
          latitude: latitude,
          longitude: longitude,
          description: description
        }
      ]);

      if (dbError) throw dbError;

      // Success, route back to citizen dashboard
      setIsSuccess(true);
      
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center h-16 px-6 sticky top-0 z-40">
        <Link to="/citizen" className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors font-bold text-sm">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Dashboard
        </Link>
      </header>

      <main className="container mx-auto p-6 md:p-12 max-w-3xl">
        <div className="bg-surface-container-lowest rounded-[2rem] p-8 md:p-12 shadow-sm border border-outline-variant/20">
          {isSuccess ? (
            <div className="flex flex-col items-center text-center py-12">
              <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center text-primary mb-8 shadow-inner animate-pulse">
                <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-on-surface font-headline mb-4">Request Successfully Accepted</h1>
              <p className="text-on-surface-variant max-w-md leading-relaxed mb-8">
                Your environmental stewardship has been logged. Our AI algorithms are currently routing your request to the nearest available worker.
              </p>
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 mb-8 max-w-sm w-full space-y-3">
                 <div className="flex justify-between text-sm">
                    <span className="font-bold text-on-surface-variant">Waste Type</span>
                    <span className="font-medium text-on-surface">{typeOfWaste}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="font-bold text-on-surface-variant">Location</span>
                    <span className="font-medium text-on-surface truncate ml-4 text-right">{location}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="font-bold text-on-surface-variant">Est. Tokens</span>
                    <span className="font-bold text-primary">+10</span>
                 </div>
              </div>
              <Link to="/citizen" className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-white font-black text-[15px] rounded-xl shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98]">
                Return to Dashboard View
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center mb-10">
                 <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center text-primary mb-4 shadow-inner">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                 </div>
                 <h1 className="text-4xl font-black tracking-tight text-on-surface font-headline">Report Waste</h1>
                 <p className="text-on-surface-variant max-w-md mt-2 leading-relaxed">Provide details and an image to help our AI assign it efficiently to the nearest worker.</p>
              </div>

              <form onSubmit={handleUpload} className="space-y-8">
                {errorMsg && (
                  <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-bold flex items-center gap-2">
                     <span className="material-symbols-outlined">error</span>
                     {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Type & Image */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pl-1 block mb-2" htmlFor="typeOfWaste">Waste Category</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'Plastic', label: 'Plastic', icon: 'recycling' },
                          { id: 'Organic', label: 'Organic', icon: 'compost' },
                          { id: 'Glass', label: 'Glass', icon: 'wine_bar' },
                          { id: 'Metal', label: 'Metal', icon: 'build' },
                          { id: 'E-Waste', label: 'E-Waste', icon: 'devices' },
                          { id: 'Mixed', label: 'Mixed', icon: 'category' }
                        ].map(type => (
                           <button
                             type="button"
                             key={type.id}
                             onClick={() => setTypeOfWaste(type.id)}
                             className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                               typeOfWaste === type.id 
                                 ? 'border-primary bg-primary/10 text-primary scale-105 shadow-sm ring-1 ring-primary/20' 
                                 : 'border-outline-variant/40 bg-surface hover:bg-surface-variant hover:border-outline-variant text-slate-500 hover:text-slate-700'
                             }`}
                           >
                             <span className="material-symbols-outlined mb-1.5 text-[22px]">{type.icon}</span>
                             <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                           </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pl-1 block mb-2">Upload Photo*</label>
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-outline-variant border-dashed rounded-2xl cursor-pointer bg-surface hover:bg-surface-variant transition-colors overflow-hidden relative">
                        {file ? (
                          <div className="flex flex-col items-center gap-2 p-4 w-full">
                             <span className="material-symbols-outlined text-primary text-3xl">check_circle</span>
                             <span className="text-sm font-bold truncate max-w-full text-center">{file.name}</span>
                             <span className="text-xs text-on-surface-variant">Click to replace</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <span className="material-symbols-outlined text-slate-400 text-3xl mb-2">add_a_photo</span>
                            <p className="mb-2 text-sm text-slate-500 font-bold">Click to capture or upload</p>
                            <p className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                         <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pl-1" htmlFor="location">Location / Landmark (Optional)</label>
                         <button 
                           type="button" 
                           onClick={captureGPS} 
                           className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                         >
                            <span className="material-symbols-outlined text-[14px]">my_location</span> Get GPS
                         </button>
                      </div>
                      <div className="relative group mb-4">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">pin_drop</span>
                        <input 
                          id="location"
                          type="text" 
                          value={location}
                          onChange={handleLocationChange}
                          className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
                          placeholder="E.g., Near City Park North Gate"
                        />
                        
                        {suggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {suggestions.map(s => (
                              <div 
                                key={s.id} 
                                onClick={() => { 
                                  setLocation(s.display_name); 
                                  setLatitude(s.lat);
                                  setLongitude(s.lon);
                                  setSuggestions([]); 
                                }}
                                className="p-3 text-xs border-b border-outline-variant/30 hover:bg-surface-variant cursor-pointer text-on-surface line-clamp-2"
                              >
                                <span className="material-symbols-outlined text-[12px] inline-block mr-1 align-middle text-slate-400">location_on</span>
                                {s.display_name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                         <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '220px', width: '100%', zIndex: 10 }}>
                           <TileLayer
                             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                           />
                           <LocationMarker 
                             position={latitude && longitude ? {lat: latitude, lng: longitude} : null} 
                             setPosition={(pos) => { 
                               setLatitude(pos.lat); 
                               setLongitude(pos.lng); 
                               if (!location) setLocation(`Map Selection: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
                             }} 
                           />
                         </MapContainer>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pl-1 block mb-2" htmlFor="estimatedWeight">Estimated Weight (kg) - Optional</label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">scale</span>
                        <input 
                          id="estimatedWeight"
                          type="number" 
                          min="0.1"
                          step="0.1"
                          value={estimatedWeight}
                          onChange={(e) => setEstimatedWeight(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
                          placeholder="1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pl-1 block mb-2" htmlFor="description">Description (Optional)</label>
                      <textarea 
                        id="description"
                        rows="3"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm resize-none"
                        placeholder="Any specific instructions for the worker?"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant/30 flex justify-end gap-4">
                  <Link to="/citizen" className="px-6 py-4 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                    Cancel
                  </Link>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-white font-black text-[15px] rounded-xl shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 min-w-[200px]"
                  >
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    ) : (
                      <>
                         Submit Report
                         <span className="material-symbols-outlined text-lg">public</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default UploadPage;
