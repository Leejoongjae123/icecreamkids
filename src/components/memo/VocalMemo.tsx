export default function VocalMemo() {
  return (
    <div>
      <audio controls>
        <source src="/audio/sample1.mp3" type="audio/mp3" />
        <track kind="captions" />
        {/* fallback */}이 문장은 사용자의 웹 브라우저가 audio 요소를 지원하지 않을 때 나타납니다.
      </audio>
    </div>
  );
}
