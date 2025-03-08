// src/CoinFlipAnimation.jsx
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import headsImg from './heads.png';
import tailsImg from './tails.png';

function Coin({ flipResult }) {
  const coinRef = useRef();
  const angleRef = useRef(0);

  const headsTexture = useLoader(TextureLoader, headsImg);
  const tailsTexture = useLoader(TextureLoader, tailsImg);

  // Réinitialiser l'angle dès que flipResult change (même si c'est la même face, on force une nouvelle animation)
  useEffect(() => {
    angleRef.current = 0;
  }, [flipResult]);

  useFrame(() => {
    if (angleRef.current < Math.PI * 4) { // 4π = 2 révolutions
      angleRef.current += 0.2;
      if (coinRef.current) {
        // On part de -90° (pour que la face soit visible) et on ajoute l'angle
        coinRef.current.rotation.x = -Math.PI / 2 + angleRef.current;
      }
    } else {
      if (coinRef.current) {
        // À la fin, on fixe la rotation pour révéler la face gagnante
        coinRef.current.rotation.x = -Math.PI / 2 + (flipResult.startsWith('heads') ? 0 : Math.PI);
      }
    }
  });

  return (
    <mesh ref={coinRef} rotation={[-Math.PI / 2, 0, 0]} scale={[1.2, 1.2, 1.2]}>
      <cylinderGeometry args={[1, 1, 0.1, 32]} />
      <meshBasicMaterial attach="material-1" map={headsTexture} transparent />
      <meshBasicMaterial attach="material-0" color="silver" />
      <meshBasicMaterial attach="material-2" map={tailsTexture} transparent />
    </mesh>
  );
}

export default function CoinFlipAnimation({ flipResult }) {
  return (
    <div className="coinflip-container">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} style={{ background: '#37367b' }}>
        <ambientLight intensity={1} />
        <Coin flipResult={flipResult} />
      </Canvas>
    </div>
  );
}
