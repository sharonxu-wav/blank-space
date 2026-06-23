import { useEffect, useRef } from "react";
import { SplineScene } from "../SplineScene";
import { useFistExit } from "../useExit";
import { appView } from "../appStore";
import { hand } from "../handState";

export default function RobotApp() {
  useFistExit(() => appView.set("home"));
  const wrap = useRef<HTMLDivElement>(null);

  // Drive the Spline scene with the hand by dispatching synthetic pointer events at the hand position.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const cv = wrap.current?.querySelector("canvas");
      if (cv && hand.present) {
        const clientX = hand.x * innerWidth, clientY = hand.y * innerHeight;
        const o: any = { clientX, clientY, bubbles: true, cancelable: true, view: window };
        cv.dispatchEvent(new PointerEvent("pointermove", { ...o, pointerId: 1, pointerType: "mouse" }));
        cv.dispatchEvent(new MouseEvent("mousemove", o));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="env-full black" ref={wrap}>
      <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="w-full h-full" />
      <div className="env-cap">INTERACTIVE 3D · move your hand</div>
      <div className="env-exit">✊ hold a fist to exit</div>
    </div>
  );
}
