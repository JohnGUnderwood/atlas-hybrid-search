import { useState } from "react";
import { Chip } from "@leafygreen-ui/chip";
import Icon from '@leafygreen-ui/icon';
import TextInput from '@leafygreen-ui/text-input';

export default function TestSteeringLayout() {
    const [steeringText, setSteeringText] = useState("");

    return (
        <div style={{ padding: "40px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
            <h1>Steering Feedback Layout Test</h1>

            <div style={{ marginBottom: "40px", backgroundColor: "white", padding: "20px" }}>
                <h3>Test 1: Basic Grid (1fr auto)</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "center", width: "100%", border: "2px solid red" }}>
                    <div style={{ minWidth: 0, border: "2px solid blue" }}>
                        <TextInput aria-label="Test" value={steeringText} onChange={(e) => setSteeringText(e.target.value)} placeholder="Add free-text steering" size="small" />
                    </div>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", border: "2px solid green" }}>
                        <Icon glyph="ThumbsUp" style={{ cursor: "pointer", color: "#00684A" }} />
                        <Icon glyph="ThumbsDown" style={{ cursor: "pointer", color: "#B45A3C" }} />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: "40px", backgroundColor: "white", padding: "20px" }}>
                <h3>Test 2: Flex layout</h3>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", border: "2px solid red" }}>
                    <div style={{ flex: 1, minWidth: 0, border: "2px solid blue" }}>
                        <TextInput aria-label="Test" value={steeringText} onChange={(e) => setSteeringText(e.target.value)} placeholder="Add free-text steering" size="small" />
                    </div>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0, border: "2px solid green" }}>
                        <Icon glyph="ThumbsUp" style={{ cursor: "pointer", color: "#00684A" }} />
                        <Icon glyph="ThumbsDown" style={{ cursor: "pointer", color: "#B45A3C" }} />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: "40px", backgroundColor: "white", padding: "20px" }}>
                <h3>Test 3: Flex with exact width on parent</h3>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "400px", border: "2px solid red" }}>
                    <div style={{ flex: 1, minWidth: 0, border: "2px solid blue" }}>
                        <TextInput aria-label="Test" value={steeringText} onChange={(e) => setSteeringText(e.target.value)} placeholder="Add free-text steering" size="small" />
                    </div>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0, border: "2px solid green" }}>
                        <Icon glyph="ThumbsUp" style={{ cursor: "pointer", color: "#00684A" }} />
                        <Icon glyph="ThumbsDown" style={{ cursor: "pointer", color: "#B45A3C" }} />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: "40px", backgroundColor: "white", padding: "20px" }}>
                <h3>Test 4: Flex with minWidth on parent</h3>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", minWidth: 0, border: "2px solid red" }}>
                    <div style={{ flex: 1, minWidth: 0, border: "2px solid blue" }}>
                        <TextInput aria-label="Test" value={steeringText} onChange={(e) => setSteeringText(e.target.value)} placeholder="Add free-text steering" size="small" />
                    </div>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0, border: "2px solid green" }}>
                        <Icon glyph="ThumbsUp" style={{ cursor: "pointer", color: "#00684A" }} />
                        <Icon glyph="ThumbsDown" style={{ cursor: "pointer", color: "#B45A3C" }} />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: "40px", backgroundColor: "white", padding: "20px" }}>
                <h3>Test 5: Flex with overflow hidden on wrapper</h3>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", minWidth: 0, overflow: "hidden", border: "2px solid red" }}>
                    <div style={{ flex: 1, minWidth: 0, overflow: "hidden", border: "2px solid blue" }}>
                        <TextInput aria-label="Test" value={steeringText} onChange={(e) => setSteeringText(e.target.value)} placeholder="Add free-text steering" size="small" />
                    </div>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0, border: "2px solid green" }}>
                        <Icon glyph="ThumbsUp" style={{ cursor: "pointer", color: "#00684A" }} />
                        <Icon glyph="ThumbsDown" style={{ cursor: "pointer", color: "#B45A3C" }} />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: "40px", backgroundColor: "white", padding: "20px" }}>
                <h3>Test 6: With parent grid 20/80 simulation</h3>
                <div style={{ display: "grid", gridTemplateColumns: "20% 80%", gap: "5px", alignItems: "start", border: "3px solid orange" }}>
                    <div style={{ border: "1px solid purple" }}>Left (20%)</div>
                    <div style={{ border: "1px solid purple" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", minWidth: 0, border: "2px solid red" }}>
                            <div style={{ flex: 1, minWidth: 0, border: "2px solid blue" }}>
                                <TextInput aria-label="Test" value={steeringText} onChange={(e) => setSteeringText(e.target.value)} placeholder="Add free-text steering" size="small" />
                            </div>
                            <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0, border: "2px solid green" }}>
                                <Icon glyph="ThumbsUp" style={{ cursor: "pointer", color: "#00684A" }} />
                                <Icon glyph="ThumbsDown" style={{ cursor: "pointer", color: "#B45A3C" }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
