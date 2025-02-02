// src/pages/CreateMemePage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Rnd } from "react-rnd";

// Icons (optional)
import { AiOutlineUndo, AiOutlineRedo } from "react-icons/ai";

// Utility for scaling
import {
  computeScale,
  realToDisplay,
  displayToReal,
  PREVIEW_MAX_WIDTH,
  PREVIEW_MAX_HEIGHT,
} from "../utils/scaleUtils";

// A localStorage key for ephemeral new memes
const LOCAL_KEY = "ephemeralMemeData";

// Some color / font arrays for UI
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
  const { id } = useParams();
  const navigate = useNavigate();

  // If user has a token => they can create a real meme record
  const token = localStorage.getItem("token");
  const hasToken = !!token; // if true => can create server record

  // Meme record fields
  const [memeId, setMemeId] = useState(null);
  const [filePath, setFilePath] = useState("");

  // Real dimension
  const [realWidth, setRealWidth] = useState(400);
  const [realHeight, setRealHeight] = useState(400);

  // Overlays => real vs display
  const [realOverlays, setRealOverlays] = useState([]);
  const [displayOverlays, setDisplayOverlays] = useState([]);

  // Undo/Redo
  const [pastStates, setPastStates] = useState([]);
  const [futureStates, setFutureStates] = useState([]);

  // Display dimension
  const [displayWidth, setDisplayWidth] = useState(PREVIEW_MAX_WIDTH);
  const [displayHeight, setDisplayHeight] = useState(PREVIEW_MAX_HEIGHT);

  // Selected overlay
  const [selectedOverlayId, setSelectedOverlayId] = useState(null);

  // For ephemeral new memes => store user’s local image as base64
  const [tempImageDataUrl, setTempImageDataUrl] = useState(null);

  // Possibly store the raw file if we want to eventually upload it
  const [tempImageFile, setTempImageFile] = useState(null);

  // Helper => do we have an image to display?
  const hasImage = !!filePath || !!tempImageDataUrl;

  // ------------------------------------------
  // On MOUNT => load ephemeral if no id => else load existing from server
  // On UNMOUNT => if new meme => clear ephemeral
  // ------------------------------------------
  useEffect(() => {
    if (id) {
      // editing existing => load from server
      loadExistingMeme(id);
    } else {
      // brand-new => check ephemeral
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
      // On unmount => if new meme => remove ephemeral data
      if (!id) {
        localStorage.removeItem(LOCAL_KEY);
      }
    };
    // eslint-disable-next-line
  }, [id]);

  // A helper to store ephemeral data with the latest state
  const storeEphemeralData = (
    newRealOverlays = realOverlays,
    newWidth = realWidth,
    newHeight = realHeight,
    newDataUrl = tempImageDataUrl
  ) => {
    if (id) return; // editing existing => no ephemeral store
    const ephemeral = {
      realWidth: newWidth,
      realHeight: newHeight,
      realOverlays: newRealOverlays,
      tempImageDataUrl: newDataUrl,
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ephemeral));
  };

  // ------------------------------------------
  // LOAD EXISTING
  // ------------------------------------------
  async function loadExistingMeme(memeId) {
    if (!hasToken) {
      alert("You are not logged in to load an existing meme!");
      navigate("/login");
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/memes/${memeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error loading meme");
      }
      const m = data.meme;
      setMemeId(m.id);
      setFilePath(m.filePath || "");

      let w = 400,
        h = 400;
      let overlays = [];
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
    } catch (err) {
      console.error("Load meme error:", err);
      alert(`Failed to load meme: ${err.message}`);
      navigate("/dashboard");
    }
  }

  // ------------------------------------------
  // CREATE new meme record if we have a token
  // ------------------------------------------
  async function createMemeRecord() {
    if (!hasToken) {
      // if not logged in => ephemeral only
      return null;
    }
    try {
      const res = await fetch("http://localhost:5000/api/memes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "active" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error creating meme record");
      }
      setMemeId(data.meme.id);
      return data.meme.id;
    } catch (err) {
      console.error("Create meme record error:", err);
      return null;
    }
  }

  // ------------------------------------------
  // SYNC updated realOverlays / dims if we have a record
  // ------------------------------------------
  async function syncMemeData(updatedReal, w, h) {
    if (!memeId) return; // ephemeral only
    try {
      const body = {
        data: {
          overlays: updatedReal,
          width: w,
          height: h,
        },
      };
      const res = await fetch(`http://localhost:5000/api/memes/${memeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errMsg = await res.json();
        throw new Error(errMsg.error || "syncMemeData error");
      }
    } catch (error) {
      console.error("syncMemeData error:", error);
    }
  }

  // ------------------------------------------
  // SELECTING FILE => for brand-new meme only
  // ------------------------------------------
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    // Reset
    setMemeId(null);
    setFilePath("");
    setRealWidth(400);
    setRealHeight(400);
    setRealOverlays([]);
    setDisplayOverlays([]);
    setPastStates([]);
    setFutureStates([]);
    setSelectedOverlayId(null);
    setDisplayWidth(PREVIEW_MAX_WIDTH);
    setDisplayHeight(PREVIEW_MAX_HEIGHT);

    // Convert file => base64
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setTempImageDataUrl(dataUrl);
      setTempImageFile(file);
      measureBase64Image(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function measureBase64Image(dataUrl) {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setRealWidth(w);
      setRealHeight(h);

      const { scale, dispW, dispH } = computeScale(w, h);
      setDisplayWidth(dispW);
      setDisplayHeight(dispH);

      // store ephemeral with the new dimension
      storeEphemeralData(realOverlays, w, h, dataUrl);
    };
    img.onerror = () => {
      alert("Failed to load base64 image. Try another file?");
      setTempImageDataUrl(null);
      setTempImageFile(null);
    };
    img.src = dataUrl;
  }

  // UPLOAD => if we get a record
  async function uploadFile(memeIdVal, file) {
    if (!hasToken) return;
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`http://localhost:5000/api/memes/${memeIdVal}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }
      const data = await res.json();
      setFilePath(data.meme.filePath);

      measureServerImage(data.meme.filePath);
    } catch (err) {
      console.error("File upload error:", err);
    }
  }

  function measureServerImage(path) {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setRealWidth(w);
      setRealHeight(h);

      const { scale, dispW, dispH } = computeScale(w, h);
      setDisplayWidth(dispW);
      setDisplayHeight(dispH);

      syncMemeData(realOverlays, w, h);
      storeEphemeralData(realOverlays, w, h, null); // once we have a server file, we can remove base64 or not
    };
    img.onerror = () => {
      alert("Could not load server image. Try again?");
    };
    img.src = `http://localhost:5000/${path}`;
  }

  // ------------------------------------------
  // COMMIT Overlays => final step => store ephemeral + sync
  // ------------------------------------------
  async function commitOverlays(newDisplayOverlays) {
    let currentId = memeId;
    if (!currentId && tempImageFile) {
      // attempt to create a record if user has token
      if (hasToken) {
        const created = await createMemeRecord();
        if (created) {
          currentId = created;
          await uploadFile(currentId, tempImageFile);
          setTempImageFile(null);
        }
      }
    }

    const { scale } = computeScale(realWidth, realHeight);
    const newReal = newDisplayOverlays.map((ov) => displayToReal(ov, scale));

    // push old overlays to "past"
    setPastStates((p) => [...p, realOverlays]);
    setFutureStates([]);

    setDisplayOverlays(newDisplayOverlays);
    setRealOverlays(newReal);

    // sync
    syncMemeData(newReal, realWidth, realHeight);

    // store ephemeral => pass in the updated newReal
    storeEphemeralData(newReal, realWidth, realHeight, tempImageDataUrl);
  }

  // ------------------------------------------
  // UNDO / REDO
  // ------------------------------------------
  function undo() {
    if (pastStates.length === 0) return;
    const prev = pastStates[pastStates.length - 1];
    setPastStates((p) => p.slice(0, p.length - 1));
    setFutureStates((f) => [...f, realOverlays]);

    setRealOverlays(prev);
    const { scale } = computeScale(realWidth, realHeight);
    setDisplayOverlays(prev.map((ov) => realToDisplay(ov, scale)));

    setSelectedOverlayId(null);

    syncMemeData(prev, realWidth, realHeight);
    storeEphemeralData(prev, realWidth, realHeight, tempImageDataUrl);
  }

  function redo() {
    if (futureStates.length === 0) return;
    const nxt = futureStates[futureStates.length - 1];
    setFutureStates((f) => f.slice(0, f.length - 1));
    setPastStates((p) => [...p, realOverlays]);

    setRealOverlays(nxt);
    const { scale } = computeScale(realWidth, realHeight);
    setDisplayOverlays(nxt.map((ov) => realToDisplay(ov, scale)));

    setSelectedOverlayId(null);

    syncMemeData(nxt, realWidth, realHeight);
    storeEphemeralData(nxt, realWidth, realHeight, tempImageDataUrl);
  }

  // ------------------------------------------
  // ADD TEXT
  // ------------------------------------------
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

  // SELECT / DELETE
  function handleSelectOverlay(overlayId) {
    setSelectedOverlayId(overlayId);
  }

  function handleDeleteOverlay() {
    if (!selectedOverlayId) return;
    const updated = displayOverlays.filter((ov) => ov.id !== selectedOverlayId);
    commitOverlays(updated);
    setSelectedOverlayId(null);
  }

  // TEXT color / BG color / Font / Font size
  function handleSetTextColor(color) {
    if (!selectedOverlayId) return;
    const updated = displayOverlays.map((ov) =>
      ov.id === selectedOverlayId ? { ...ov, textColor: color } : ov
    );
    commitOverlays(updated);
  }

  function handleSetBgColor(value) {
    if (!selectedOverlayId) return;
    const updated = displayOverlays.map((ov) =>
      ov.id === selectedOverlayId ? { ...ov, bgColor: value } : ov
    );
    commitOverlays(updated);
  }

  function handleSetFontFamily(family) {
    if (!selectedOverlayId) return;
    const updated = displayOverlays.map((ov) =>
      ov.id === selectedOverlayId ? { ...ov, fontFamily: family } : ov
    );
    commitOverlays(updated);
  }

  function handleSetFontSize(newSize) {
    if (!selectedOverlayId) return;
    const sizeNum = parseInt(newSize, 10);
    if (isNaN(sizeNum)) return;
    const updated = displayOverlays.map((ov) =>
      ov.id === selectedOverlayId ? { ...ov, fontSize: sizeNum } : ov
    );
    commitOverlays(updated);
  }

  function handleDoubleClickOverlay(overlayId) {
    setSelectedOverlayId(overlayId);
    setDisplayOverlays((prev) =>
      prev.map((ov) => (ov.id === overlayId ? { ...ov, isEditing: true } : ov))
    );
  }

  function handleFinishEditing(overlayId) {
    const updated = displayOverlays.map((ov) =>
      ov.id === overlayId ? { ...ov, isEditing: false } : ov
    );
    commitOverlays(updated);
  }

  function handleTextChange(overlayId, newText) {
    // Just set local for now
    setDisplayOverlays((prev) =>
      prev.map((ov) => (ov.id === overlayId ? { ...ov, text: newText } : ov))
    );
  }

  // ------------------------------------------
  // DOWNLOAD => Canvas approach
  // ------------------------------------------
  async function handleDownload() {
    if (!hasImage) {
      alert("No image to download.");
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = realWidth;
      canvas.height = realHeight;
      const ctx = canvas.getContext("2d");

      let imageSrc = "";
      if (filePath) {
        imageSrc = `http://localhost:5000/${filePath}`;
      } else if (tempImageDataUrl) {
        imageSrc = tempImageDataUrl;
      } else {
        alert("No image to compose.");
        return;
      }

      const mainImg = new Image();
      mainImg.crossOrigin = "anonymous";
      mainImg.onload = () => {
        ctx.drawImage(mainImg, 0, 0, realWidth, realHeight);

        // draw overlays
        realOverlays.forEach((ov) => {
          if (ov.bgColor) {
            ctx.fillStyle = ov.bgColor;
            ctx.fillRect(ov.x, ov.y, ov.width, ov.height);
          }
          const textX = ov.x + ov.width / 2;
          const textY = ov.y + ov.height / 2;
          ctx.fillStyle = ov.textColor || "#000000";
          ctx.font = `bold ${ov.fontSize}px ${ov.fontFamily || "Arial"}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ov.text || "", textX, textY, ov.width);
        });

        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "meme.png";
        link.href = dataUrl;
        link.click();
      };
      mainImg.onerror = () => {
        alert("Error loading main image for final composition.");
      };
      mainImg.src = imageSrc;
    } catch (err) {
      console.error("Download error:", err);
      alert(`Failed to download meme: ${err.message}`);
    }
  }

  // ------------------------------------------
  // REMOVE FILE => start fresh
  // ------------------------------------------
  function handleRemoveFile() {
    setTempImageDataUrl(null);
    setTempImageFile(null);
    setFilePath("");
    setMemeId(null);

    setRealWidth(400);
    setRealHeight(400);
    setRealOverlays([]);
    setDisplayOverlays([]);
    setPastStates([]);
    setFutureStates([]);
    setSelectedOverlayId(null);
    setDisplayWidth(PREVIEW_MAX_WIDTH);
    setDisplayHeight(PREVIEW_MAX_HEIGHT);

    if (id) {
      // If we are editing existing => optional if you want to delete or not
    } else {
      localStorage.removeItem(LOCAL_KEY);
    }
  }

  // RENDER
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-200 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
        {id ? "Edit Meme" : "Create a Meme"}
      </h1>

      {/* If we have an image => show top toolbar */}
      {hasImage && (
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleAddText}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition-colors"
          >
            Add Text
          </button>

          <button
            onClick={undo}
            disabled={pastStates.length === 0}
            className={`${
              pastStates.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gray-500 hover:bg-gray-600"
            } text-white px-4 py-2 rounded-lg shadow flex items-center gap-1 transition-colors`}
          >
            <AiOutlineUndo />
            Undo
          </button>

          <button
            onClick={redo}
            disabled={futureStates.length === 0}
            className={`${
              futureStates.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gray-500 hover:bg-gray-600"
            } text-white px-4 py-2 rounded-lg shadow flex items-center gap-1 transition-colors`}
          >
            <AiOutlineRedo />
            Redo
          </button>

          <button
            onClick={handleDownload}
            disabled={!memeId && realOverlays.length === 0}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            Download
          </button>

          <button
            onClick={handleRemoveFile}
            className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition-colors"
          >
            Remove File
          </button>
        </div>
      )}

      {/* If no image => upload area */}
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

      {/* If we have an image => main preview + overlay controls */}
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
            {/* Show server or ephemeral image */}
            {filePath ? (
              <img
                src={`http://localhost:5000/${filePath}`}
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

            {/* Overlays => scaled */}
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
                onResizeStop={(e, direction, ref, delta, position) => {
                  const newW = parseFloat(ref.style.width);
                  const newH = parseFloat(ref.style.height);
                  const newX = position.x;
                  const newY = position.y;

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
                            Math.sqrt(
                              (newW / item.width) * (newH / item.height)
                            ),
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
                  outline:
                    ov.id === selectedOverlayId ? "2px solid #6366F1" : "none",
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

          {/* If user selected an overlay => show "Overlay Controls" */}
          {selectedOverlayId && (
            <div className="w-full max-w-2xl bg-white border border-gray-300 rounded-xl shadow-lg p-4 mt-6">
              <h2 className="text-xl font-semibold mb-4">Overlay Controls</h2>

              {/* Text Color */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1">
                  Text Color:
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSetTextColor(c)}
                      style={{ backgroundColor: c }}
                      className="w-8 h-8 rounded-full border border-gray-300 hover:opacity-80"
                    />
                  ))}
                </div>
              </div>

              {/* Surface (Background) */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1">
                  Surface Color:
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  onChange={(e) => handleSetBgColor(e.target.value)}
                  value={
                    displayOverlays.find((o) => o.id === selectedOverlayId)?.bgColor ||
                    ""
                  }
                >
                  {BG_COLORS.map((bg) => (
                    <option key={bg.value} value={bg.value}>
                      {bg.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Family */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1">
                  Font Family:
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  onChange={(e) => handleSetFontFamily(e.target.value)}
                  value={
                    displayOverlays.find((o) => o.id === selectedOverlayId)
                      ?.fontFamily || "Arial, sans-serif"
                  }
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-1">
                  Font Size:
                </label>
                <input
                  type="range"
                  min="8"
                  max="80"
                  step="1"
                  onChange={(e) => handleSetFontSize(e.target.value)}
                  className="w-full"
                  value={
                    displayOverlays.find((o) => o.id === selectedOverlayId)
                      ?.fontSize || 20
                  }
                />
              </div>

              {/* Delete Overlay */}
              <button
                onClick={handleDeleteOverlay}
                className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition-colors"
              >
                Delete This Overlay
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CreateMemePage;