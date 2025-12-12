export const getRandomColor = () => {
  const colors = [
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ffff00', // Yellow
    '#00ff00', // Lime
    '#ff0099', // Hot Pink
    '#ffffff', // White
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        // remove "data:audio/wav;base64," prefix
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
