"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const fontOptions = [
  { value: "pretendard", label: "Pretendard" },
  { value: "arial", label: "Arial" },
  { value: "helvetica", label: "Helvetica" },
  { value: "georgia", label: "Georgia" },
  { value: "times", label: "Times New Roman" },
];

const fontSizeOptions = [
  { value: "12", label: "12pt" },
  { value: "14", label: "14pt" },
  { value: "16", label: "16pt" },
  { value: "18", label: "18pt" },
  { value: "20", label: "20pt" },
  { value: "24", label: "24pt" },
];

const colorPalette = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080"
];

function InputDesign() {
  const [selectedFont, setSelectedFont] = React.useState("pretendard");
  const [selectedFontSize, setSelectedFontSize] = React.useState("14");
  const [textColor, setTextColor] = React.useState("#000000");
  const [textAlignment, setTextAlignment] = React.useState("left");
  const [backgroundColor, setBackgroundColor] = React.useState("#ffffff");
  const [opacity, setOpacity] = React.useState("50");
  const [showTextColorPalette, setShowTextColorPalette] = React.useState(false);
  const [showBackgroundColorPalette, setShowBackgroundColorPalette] = React.useState(false);

  const handleTextColorSelect = (color: string) => {
    setTextColor(color);
    setShowTextColorPalette(false);
  };

  const handleBackgroundColorSelect = (color: string) => {
    setBackgroundColor(color);
    setShowBackgroundColorPalette(false);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-gray-700">스타일</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 텍스트 섹션 */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-gray-700">텍스트</Label>
          
          {/* 폰트와 글자크기 - 세로 배치 */}
          <div className="space-y-2">
            <div>
              <Select value={selectedFont} onValueChange={setSelectedFont}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value} className="text-xs">
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedFontSize} onValueChange={setSelectedFontSize}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontSizeOptions.map((size) => (
                    <SelectItem key={size.value} value={size.value} className="text-xs">
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 텍스트 색상 */}
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <div 
                className="w-5 h-5 rounded border border-zinc-200 cursor-pointer"
                style={{ backgroundColor: textColor }}
                onClick={() => setShowTextColorPalette(!showTextColorPalette)}
              />
              <Input
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="flex-1 h-8 text-xs"
                placeholder="#000000"
              />
            </div>

            {/* 텍스트 색상 팔레트 - 조건부 렌더링 */}
            {showTextColorPalette && (
              <div className="flex flex-wrap gap-1 p-2 border border-zinc-200 rounded bg-white">
                {colorPalette.map((color) => (
                  <div
                    key={color}
                    className={`w-4 h-4 rounded cursor-pointer border ${
                      textColor === color ? 'border-blue-500 border-2' : 'border-zinc-200'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleTextColorSelect(color)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 텍스트 정렬 */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className={`h-8 w-8 p-0 ${
                textAlignment === "left" 
                  ? "border-primary border-2 bg-primary/5" 
                  : "border-zinc-200"
              }`}
              onClick={() => setTextAlignment("left")}
            >
              <AlignLeft className={`h-3 w-3 ${textAlignment === "left" ? "text-primary" : "text-black"}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 w-8 p-0 ${
                textAlignment === "center" 
                  ? "border-primary border-2 bg-primary/5" 
                  : "border-zinc-200"
              }`}
              onClick={() => setTextAlignment("center")}
            >
              <AlignCenter className={`h-3 w-3 ${textAlignment === "center" ? "text-primary" : "text-black"}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 w-8 p-0 ${
                textAlignment === "right" 
                  ? "border-primary border-2 bg-primary/5" 
                  : "border-zinc-200"
              }`}
              onClick={() => setTextAlignment("right")}
            >
              <AlignRight className={`h-3 w-3 ${textAlignment === "right" ? "text-primary" : "text-black"}`} />
            </Button>
          </div>
        </div>

        {/* 배경 섹션 */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-gray-700">배경</Label>
          
          {/* 배경 색상 */}
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <div 
                className="w-5 h-5 rounded border border-zinc-200 cursor-pointer"
                style={{ backgroundColor: backgroundColor }}
                onClick={() => setShowBackgroundColorPalette(!showBackgroundColorPalette)}
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 h-8 text-xs"
                placeholder="#ffffff"
              />
            </div>

            {/* 배경 색상 팔레트 - 조건부 렌더링 */}
            {showBackgroundColorPalette && (
              <div className="flex flex-wrap gap-1 p-2 border border-zinc-200 rounded bg-white">
                {colorPalette.map((color) => (
                  <div
                    key={color}
                    className={`w-4 h-4 rounded cursor-pointer border ${
                      backgroundColor === color ? 'border-blue-500 border-2' : 'border-zinc-200'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleBackgroundColorSelect(color)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 투명도 */}
          <div className="flex gap-2 items-center">
            <Input
              value={opacity}
              onChange={(e) => setOpacity(e.target.value)}
              className="flex-1 h-8 text-xs"
              placeholder="50"
              type="number"
              min="0"
              max="100"
            />
            <span className="text-xs text-gray-700">%</span>
          </div>
        </div>

        {/* 적용 버튼 */}
        <Button className="w-full h-9 bg-primary hover:bg-primary/80 text-white">
          적용
        </Button>
      </CardContent>
    </Card>
  );
}

export default InputDesign;
