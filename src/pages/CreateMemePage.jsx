// gimme-memes-frontend/src/pages/CreateMemePage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Rnd } from "react-rnd";
import {
  AiOutlineUndo,
  AiOutlineRedo,
  AiOutlineDownload,
  AiOutlineSave,
  AiOutlineDelete,
} from "react-icons/ai";
import { FiType } from "react-icons/fi";
import { MdPalette } from "react-icons/md";
import { Helmet } from "react-helmet-async";
import {
  computeScale,
  realToDisplay,
  displayToReal,
  PREVIEW_MAX_WIDTH,
  PREVIEW_MAX_HEIGHT,
} from "../utils/scaleUtils";
import { baseApiUrl } from "../utils/api";

// For ephemeral local usage if there's no "id"
const LOCAL_KEY = "ephemeralMemeData";

// Constants for styling options
const TEXT_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FFA500", "#FF00FF", "#800080", "#008080",
  "#808080", "#B22222",
];
const BG_COLORS = [
  { label: "None", value: "" },
  { label: "White", value: "#FFFFFF" },
  { label: "Black", value: "#000000" },
  { label: "Red", value: "#FF0000" },
  { label: "Blue", value: "#0000FF" },
  { label: "Green", value: "#00FF00" },
  { label: "Yellow", value: "#FFFF00" },
  { label: "Orange", value: "#FFA500" },
  { label: "Pink", value: "#FF69B4" },
  { label: "Gray", value: "#808080" },
];
const FONT_FAMILIES = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Impact", value: "Impact, Charcoal, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Comic Sans MS", value: "'Comic Sans MS', cursive, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', Helvetica, sans-serif" },
];

function CreateMemePage() {
  const { id } = useParams(); // if provided => edit existing meme
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  // Meme state variables
  const [memeId, setMemeId] = useState(null);
  const [filePath, setFilePath] = useState("");
  const [tempImageDataUrl, setTempImageDataUrl] = useState(null);

  // Dimensions
  const [realWidth, setRealWidth] = useState(400);
  const [realHeight, setRealHeight] = useState(400);

  // Overlays
  const [realOverlays, setRealOverlays] = useState([]);
  const [displayOverlays, setDisplayOverlays] = useState([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState(null);

  // Undo/Redo
  const [pastStates, setPastStates] = useState([]);
  const [futureStates, setFutureStates] = useState([]);

  // Preview dimensions
  const [displayWidth, setDisplayWidth] = useState(PREVIEW_MAX_WIDTH);
  const [displayHeight, setDisplayHeight] = useState(PREVIEW_MAX_HEIGHT);

  // Toolbar: active panel for detailed settings ("text", "colors", or "surface")
  const [activePanel, setActivePanel] = useState(null);

  // Whether an image is available (either saved or ephemeral)
  const hasImage = !!filePath || !!tempImageDataUrl;

  // ----------------------------------------
  // On mount: load existing meme if editing, otherwise load ephemeral data.
  // ----------------------------------------
  useEffect(() => {
    if (id) {
      loadExistingMeme(id);
    } else {
      const stored = localStorage.getItem(LOCAL_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.realWidth) setRealWidth(parsed.realWidth);
        if (parsed.realHeight) setRealHeight(parsed.realHeight);
        if (parsed.realOverlays) setRealOverlays(parsed.realOverlays);
        const { scale, dispW, dispH } = computeScale(
          parsed.realWidth || 400,
          parsed.realHeight || 400
        );
        setDisplayWidth(dispW);
        setDisplayHeight(dispH);
        if (parsed.realOverlays?.length) {
          const scaled = parsed.realOverlays.map((ov) => realToDisplay(ov, scale));
          setDisplayOverlays(scaled);
        }
        if (parsed.tempImageDataUrl) {
          setTempImageDataUrl(parsed.tempImageDataUrl);
        }
      }
    }
    return () => {
      if (!id) localStorage.removeItem(LOCAL_KEY);
    };
  }, [id]);

  // Helper: store ephemeral data (only for new memes)
  function storeEphemeralData(overlays = realOverlays, w = realWidth, h = realHeight, dataUrl = tempImageDataUrl) {
    if (id) return;
    const ephemeral = { realWidth: w, realHeight: h, realOverlays: overlays, tempImageDataUrl: dataUrl };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ephemeral));
  }

  // ----------------------------------------
  // LOAD existing meme from server
  // ----------------------------------------
  async function loadExistingMeme(memeIdParam) {
    if (!isLoggedIn) {
      alert("Please log in to edit an existing meme!");
      navigate("/login");
      return;
    }
    try {
      const res = await fetch(`${baseApiUrl}/api/memes/${memeIdParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error loading meme");
      const m = data.meme;
      setMemeId(m.id);
      setFilePath(m.filePath || "");
      let w = 400, h = 400, overlays = [];
      if (m.data) {
        overlays = m.data.overlays || [];
        w = m.data.width || 400;
        h = m.data.height || 400;
      }
      setRealWidth(w);
      setRealHeight(h);
      setRealOverlays(overlays);
      const { scale, dispW, dispH } = computeScale(w, h);
      setDisplayWidth(dispW);
      setDisplayHeight(dispH);
      const scaled = overlays.map((ov) => realToDisplay(ov, scale));
      setDisplayOverlays(scaled);
      setTempImageDataUrl(null);
    } catch (err) {
      console.error("Load meme error:", err);
      alert(err.message);
      navigate("/dashboard");
    }
  }

  // ----------------------------------------
  // Handle file selection (read file as base64; no auto-upload)
  // ----------------------------------------
  function handleFileSelect(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    // Reset for new meme
    setMemeId(null);
    setFilePath("");
    setTempImageDataUrl(null);
    setRealWidth(400);
    setRealHeight(400);
    setRealOverlays([]);
    setDisplayOverlays([]);
    setPastStates([]);
    setFutureStates([]);
    setSelectedOverlayId(null);
    setDisplayWidth(PREVIEW_MAX_WIDTH);
    setDisplayHeight(PREVIEW_MAX_HEIGHT);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
        alert("Invalid image file!");
        return;
      }
      setTempImageDataUrl(dataUrl);
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        setRealWidth(w);
        setRealHeight(h);
        const { scale, dispW, dispH } = computeScale(w, h);
        setDisplayWidth(dispW);
        setDisplayHeight(dispH);
        storeEphemeralData([], w, h, dataUrl);
      };
      img.onerror = () => alert("Could not load image. Please try another file.");
      img.src = dataUrl;
    };
    reader.onerror = () => alert("Error reading image file.");
    reader.readAsDataURL(file);
  }

  // ----------------------------------------
  // Commit overlay changes locally
  // ----------------------------------------
  function commitOverlays(newDisplay) {
    const { scale } = computeScale(realWidth, realHeight);
    const newReal = newDisplay.map((ov) => displayToReal(ov, scale));
    setPastStates((p) => [...p, realOverlays]);
    setFutureStates([]);
    setDisplayOverlays(newDisplay);
    setRealOverlays(newReal);
    storeEphemeralData(newReal, realWidth, realHeight, tempImageDataUrl);
  }

  // Undo / Redo actions
  function undo() {
    if (!pastStates.length) return;
    const prev = pastStates[pastStates.length - 1];
    setPastStates((p) => p.slice(0, -1));
    setFutureStates((f) => [...f, realOverlays]);
    setRealOverlays(prev);
    const { scale } = computeScale(realWidth, realHeight);
    setDisplayOverlays(prev.map((ov) => realToDisplay(ov, scale)));
    setSelectedOverlayId(null);
    storeEphemeralData(prev, realWidth, realHeight, tempImageDataUrl);
  }
  function redo() {
    if (!futureStates.length) return;
    const nxt = futureStates[futureStates.length - 1];
    setFutureStates((f) => f.slice(0, -1));
    setPastStates((p) => [...p, realOverlays]);
    setRealOverlays(nxt);
    const { scale } = computeScale(realWidth, realHeight);
    setDisplayOverlays(nxt.map((ov) => realToDisplay(ov, scale)));
    setSelectedOverlayId(null);
    storeEphemeralData(nxt, realWidth, realHeight, tempImageDataUrl);
  }

  // ----------------------------------------
  // Overlay actions (text editing)
  // ----------------------------------------
  function handleAddText() {
    const newOverlay = {
      id: Date.now(),
      x: 50,
      y: 50,
      width: 200,
      height: 50,
      fontSize: 20,
      textColor: "#FFFFFF",
      bgColor: "",
      fontFamily: "Arial, sans-serif",
      isEditing: false,
      text: "Double-click to edit",
    };
    commitOverlays([...displayOverlays, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
  }
  function handleSelectOverlay(overlayId) {
    setSelectedOverlayId(overlayId);
  }
  function handleDeleteOverlay() {
    if (!selectedOverlayId) return;
    commitOverlays(displayOverlays.filter((ov) => ov.id !== selectedOverlayId));
    setSelectedOverlayId(null);
  }
  function handleSetTextColor(c) {
    if (!selectedOverlayId) return;
    commitOverlays(
      displayOverlays.map((ov) =>
        ov.id === selectedOverlayId ? { ...ov, textColor: c } : ov
      )
    );
  }
  function handleSetBgColor(val) {
    if (!selectedOverlayId) return;
    commitOverlays(
      displayOverlays.map((ov) =>
        ov.id === selectedOverlayId ? { ...ov, bgColor: val } : ov
      )
    );
  }
  function handleSetFontFamily(fam) {
    if (!selectedOverlayId) return;
    commitOverlays(
      displayOverlays.map((ov) =>
        ov.id === selectedOverlayId ? { ...ov, fontFamily: fam } : ov
      )
    );
  }
  function handleSetFontSize(num) {
    if (!selectedOverlayId) return;
    const size = parseInt(num, 10);
    if (isNaN(size)) return;
    commitOverlays(
      displayOverlays.map((ov) =>
        ov.id === selectedOverlayId ? { ...ov, fontSize: size } : ov
      )
    );
  }
  function handleDoubleClickOverlay(overlayId) {
    setSelectedOverlayId(overlayId);
    setDisplayOverlays((prev) =>
      prev.map((ov) => (ov.id === overlayId ? { ...ov, isEditing: true } : ov))
    );
  }
  function handleFinishEditing(overlayId) {
    commitOverlays(
      displayOverlays.map((ov) =>
        ov.id === overlayId ? { ...ov, isEditing: false } : ov
      )
    );
  }
  function handleTextChange(overlayId, newText) {
    setDisplayOverlays((prev) =>
      prev.map((ov) => (ov.id === overlayId ? { ...ov, text: newText } : ov))
    );
  }

  // ----------------------------------------
  // Download local (merge overlays on canvas)
  // ----------------------------------------
  async function handleDownloadLocal() {
    if (!hasImage) {
      alert("No image to download.");
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = realWidth;
      canvas.height = realHeight;
      const ctx = canvas.getContext("2d");
  
      const baseImg = new Image();
      baseImg.crossOrigin = "anonymous";
      baseImg.onload = () => {
        ctx.drawImage(baseImg, 0, 0, realWidth, realHeight);
        realOverlays.forEach((ov) => {
          if (ov.bgColor) {
            ctx.fillStyle = ov.bgColor;
            ctx.fillRect(ov.x, ov.y, ov.width, ov.height);
          }
          ctx.fillStyle = ov.textColor;
          ctx.font = `bold ${ov.fontSize}px ${ov.fontFamily}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const centerX = ov.x + ov.width / 2;
          const centerY = ov.y + ov.height / 2;
          ctx.fillText(ov.text || "", centerX, centerY, ov.width);
        });
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "meme.png";
        link.href = dataUrl;
        link.click();
      };
      baseImg.onerror = () => alert("Error loading base image for local download");
      baseImg.src = filePath || tempImageDataUrl || "";
    } catch (err) {
      console.error("Download local error:", err);
      alert(err.message);
    }
  }
  
  // ----------------------------------------
  // Save Meme: merge overlays, upload final image, update record
  // ----------------------------------------
  async function handleSaveMeme() {
    if (!isLoggedIn) {
      alert("Please log in or create an account to save your meme!");
      return;
    }
    if (!hasImage) {
      alert("No image to save. Please upload an image first.");
      return;
    }
    try {
      let currentId = memeId;
      if (!currentId) {
        const createRes = await fetch(`${baseApiUrl}/api/memes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "draft" }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createData.error || "Error creating meme record");
        }
        currentId = createData.meme.id;
        setMemeId(currentId);
      }
  
      const canvas = document.createElement("canvas");
      canvas.width = realWidth;
      canvas.height = realHeight;
      const ctx = canvas.getContext("2d");
  
      const baseImg = new Image();
      baseImg.crossOrigin = "anonymous";
      const baseImgSrc = filePath || tempImageDataUrl || "";
      baseImg.onload = async () => {
        ctx.drawImage(baseImg, 0, 0, realWidth, realHeight);
        realOverlays.forEach((ov) => {
          if (ov.bgColor) {
            ctx.fillStyle = ov.bgColor;
            ctx.fillRect(ov.x, ov.y, ov.width, ov.height);
          }
          ctx.fillStyle = ov.textColor;
          ctx.font = `bold ${ov.fontSize}px ${ov.fontFamily}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const centerX = ov.x + ov.width / 2;
          const centerY = ov.y + ov.height / 2;
          ctx.fillText(ov.text || "", centerX, centerY, ov.width);
        });
  
        canvas.toBlob(async (blob) => {
          if (!blob) {
            alert("Failed to convert final image to blob");
            return;
          }
          const formData = new FormData();
          formData.append("file", blob, "final_meme.png");
  
          const uploadRes = await fetch(`${baseApiUrl}/api/memes/${currentId}/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) {
            alert(uploadData.error || "Error uploading final meme");
            return;
          }
          setFilePath(uploadData.meme.filePath);
          alert("Meme saved successfully! Check your Dashboard.");
        }, "image/png");
      };
      baseImg.onerror = () => alert("Could not load base image for final merge");
      baseImg.src = baseImgSrc;
    } catch (err) {
      console.error("Save meme error:", err);
      alert(err.message);
    }
  }
  
  // ----------------------------------------
  // Remove File: reset all states
  // ----------------------------------------
  function handleRemoveFile() {
    setMemeId(null);
    setFilePath("");
    setTempImageDataUrl(null);
    setRealWidth(400);
    setRealHeight(400);
    setRealOverlays([]);
    setDisplayOverlays([]);
    setPastStates([]);
    setFutureStates([]);
    setSelectedOverlayId(null);
    setDisplayWidth(PREVIEW_MAX_WIDTH);
    setDisplayHeight(PREVIEW_MAX_HEIGHT);
    if (!id) localStorage.removeItem(LOCAL_KEY);
  }
  
  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-200 p-6 flex flex-col items-center">
      <Helmet>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-CR21WBQXGL"></script>
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-CR21WBQXGL');
        `}</script>
      </Helmet>
  
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
        {id ? "Edit Meme" : "Create a Meme"}
      </h1>
  
      {/* Toolbar area */}
      {hasImage && (
        <div className="relative w-full max-w-2xl mb-6">
          <MemeEditorToolbar
            onAddText={handleAddText}
            onUndo={undo}
            onRedo={redo}
            onDownload={handleDownloadLocal}
            onSave={handleSaveMeme}
            onRemoveFile={handleRemoveFile}
            onDeleteOverlay={handleDeleteOverlay}
            onSetFontFamily={handleSetFontFamily}
            onSetFontSize={handleSetFontSize}
            onSetTextColor={handleSetTextColor}
            onSetBgColor={handleSetBgColor}
            selectedOverlay={
              displayOverlays.find((ov) => ov.id === selectedOverlayId) || null
            }
          />
        </div>
      )}
  
      {!hasImage && (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-10 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition duration-300 ease-in-out shadow-md bg-white">
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer text-center">
            <span className="block mb-4 text-3xl font-semibold text-gray-700">
              Upload an Image
            </span>
            <span className="inline-block px-8 py-4 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-colors">
              Choose File
            </span>
            <span className="block mt-4 text-lg text-gray-500">
              or drag &amp; drop your image here
            </span>
          </label>
        </div>
      )}
  
      {hasImage && (
        <>
          <div
            className="relative border border-gray-300 bg-white rounded-xl overflow-hidden shadow-lg mx-auto"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
              maxWidth: "100%",
            }}
          >
            {filePath ? (
              <img
                src={filePath}
                alt="Meme"
                className="w-full h-full object-contain"
              />
            ) : tempImageDataUrl ? (
              <img
                src={tempImageDataUrl}
                alt="Temp Meme"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No image
              </div>
            )}
  
            {displayOverlays.map((ov) => (
              <Rnd
                key={ov.id}
                size={{ width: ov.width, height: ov.height }}
                position={{ x: ov.x, y: ov.y }}
                bounds="parent"
                onDragStop={(e, d) => {
                  const updated = displayOverlays.map((item) =>
                    item.id === ov.id ? { ...item, x: d.x, y: d.y } : item
                  );
                  commitOverlays(updated);
                }}
                onResizeStop={(e, direction, ref, delta, pos) => {
                  const newW = parseFloat(ref.style.width);
                  const newH = parseFloat(ref.style.height);
                  const newX = pos.x;
                  const newY = pos.y;
                  const updated = displayOverlays.map((item) =>
                    item.id === ov.id
                      ? {
                          ...item,
                          width: newW,
                          height: newH,
                          x: newX,
                          y: newY,
                          fontSize:
                            item.fontSize *
                            Math.sqrt((newW / item.width) * (newH / item.height)),
                        }
                      : item
                  );
                  commitOverlays(updated);
                }}
                style={{
                  cursor: "move",
                  backgroundColor: ov.bgColor || "transparent",
                  color: ov.textColor,
                  fontWeight: "bold",
                  fontSize: `${ov.fontSize}px`,
                  fontFamily: ov.fontFamily,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  userSelect: "none",
                  outline: ov.id === selectedOverlayId ? "2px solid #6366F1" : "none",
                }}
                onClick={() => handleSelectOverlay(ov.id)}
                onDoubleClick={() => handleDoubleClickOverlay(ov.id)}
              >
                {ov.isEditing ? (
                  <input
                    autoFocus
                    type="text"
                    value={ov.text}
                    onChange={(e) => handleTextChange(ov.id, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => handleFinishEditing(ov.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFinishEditing(ov.id);
                    }}
                    className="w-full h-full text-center bg-transparent outline-none"
                    style={{
                      color: ov.textColor,
                      fontSize: `${ov.fontSize}px`,
                      fontFamily: ov.fontFamily,
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center px-1">
                    {ov.text}
                  </div>
                )}
              </Rnd>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// New toolbar component with icon buttons and absolutely positioned pop-up panels with labels
function MemeEditorToolbar({
  onAddText,
  onUndo,
  onRedo,
  onDownload,
  onSave,
  onRemoveFile,
  onDeleteOverlay,
  onSetFontFamily,
  onSetFontSize,
  onSetTextColor,
  onSetBgColor,
  selectedOverlay,
}) {
  const [activePanel, setActivePanel] = useState(null); // "text", "colors", "surface", or null

  // Toggle panel without affecting layout using absolute positioning.
  const togglePanel = (panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="relative">
      {/* Toolbar row with icons and labels */}
      <div className="flex justify-around items-center bg-gray-100 rounded-lg p-2 shadow">
        <div className="flex flex-col items-center">
          <button onClick={onAddText} title="Add Text" className="p-2">
            <FiType size={24} />
          </button>
          <span className="text-xs text-gray-600">Add Text</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={() => togglePanel("text")} title="Text Options" className="p-2">
            <span className="font-bold text-lg">T</span>
          </button>
          <span className="text-xs text-gray-600">Text</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={() => togglePanel("colors")} title="Text Color" className="p-2">
            <MdPalette size={24} />
          </button>
          <span className="text-xs text-gray-600">Color</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={() => togglePanel("surface")} title="Surface Color" className="p-2">
            <span className="block w-6 h-6 bg-gray-400 rounded-full" />
          </button>
          <span className="text-xs text-gray-600">Surface</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={onDeleteOverlay} title="Remove Selected Text" className="p-2">
            <AiOutlineDelete size={24} />
          </button>
          <span className="text-xs text-gray-600">Remove</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={onUndo} title="Undo" className="p-2">
            <AiOutlineUndo size={24} />
          </button>
          <span className="text-xs text-gray-600">Undo</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={onRedo} title="Redo" className="p-2">
            <AiOutlineRedo size={24} />
          </button>
          <span className="text-xs text-gray-600">Redo</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={onDownload} title="Download (Local)" className="p-2">
            <AiOutlineDownload size={24} />
          </button>
          <span className="text-xs text-gray-600">Download</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={onSave} title="Save Meme" className="p-2">
            <AiOutlineSave size={24} />
          </button>
          <span className="text-xs text-gray-600">Save</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={onRemoveFile} title="Remove File" className="p-2">
            <AiOutlineDelete size={24} />
          </button>
          <span className="text-xs text-gray-600">Remove</span>
        </div>
      </div>
      {/* Absolute pop-up panel */}
      {activePanel && selectedOverlay && (
        <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-white p-4 rounded-lg shadow border z-10">
          {activePanel === "text" && (
            <>
              <h3 className="text-lg font-semibold mb-2">Text Options</h3>
              <div className="mb-2">
                <label className="block text-gray-700 mb-1">Font Family:</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  onChange={(e) => onSetFontFamily(e.target.value)}
                  defaultValue={selectedOverlay.fontFamily || "Arial, sans-serif"}
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Font Size:</label>
                <input
                  type="range"
                  min="8"
                  max="80"
                  step="1"
                  onChange={(e) => onSetFontSize(e.target.value)}
                  defaultValue={selectedOverlay.fontSize || 20}
                  className="w-full"
                />
              </div>
            </>
          )}
          {activePanel === "colors" && (
            <>
              <h3 className="text-lg font-semibold mb-2">Text Color</h3>
              <div className="flex flex-wrap gap-2">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onSetTextColor(c)}
                    style={{ backgroundColor: c }}
                    className="w-8 h-8 rounded-full border border-gray-300 hover:opacity-80"
                  />
                ))}
              </div>
            </>
          )}
          {activePanel === "surface" && (
            <>
              <h3 className="text-lg font-semibold mb-2">Surface Color</h3>
              <div className="flex flex-wrap gap-2">
                {BG_COLORS.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => onSetBgColor(bg.value)}
                    style={{ backgroundColor: bg.value || "transparent" }}
                    className="w-8 h-8 rounded-full border border-gray-300 hover:opacity-80"
                  >
                    {!bg.value && <span className="text-xs">None</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CreateMemePage;