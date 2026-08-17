import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api, { getErrorMessage } from "./api";
import { useAuth } from "./AuthContext";

const SiteContext = createContext();

function getSiteIdFromUrl() {
  return new URLSearchParams(window.location.search).get("site_id") || "";
}

export function SiteProvider({ children }) {
  const { token } = useAuth();
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSites = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/sites");
      const activeSites = (res.data.data || []).filter((s) => s.is_active);
      setSites(activeSites);

      if (activeSites.length > 0) {
        // Pakai site_id dari URL jika valid; selain itu default site pertama.
        const urlSiteId = getSiteIdFromUrl();
        const resolved = activeSites.some((s) => s.id === urlSiteId)
          ? urlSiteId
          : activeSites[0].id;
        setSelectedSiteId(resolved);
      } else {
        setSelectedSiteId("");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat daftar site."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchSites();
    }
  }, [fetchSites, token]);

  // Sinkronkan selectedSiteId ke query param URL setiap kali berubah,
  // termasuk saat pertama kali ditetapkan setelah login/fetch sites.
  useEffect(() => {
    const url = new URL(window.location.href);
    const current = url.searchParams.get("site_id") || "";
    if (selectedSiteId === current) return;
    if (selectedSiteId) {
      url.searchParams.set("site_id", selectedSiteId);
    } else {
      url.searchParams.delete("site_id");
    }
    window.history.replaceState({}, "", url.toString());
  }, [selectedSiteId]);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || null;

  return (
    <SiteContext.Provider
      value={{
        sites,
        selectedSiteId,
        setSelectedSiteId,
        selectedSite,
        loading,
        error,
        refetchSites: fetchSites,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
