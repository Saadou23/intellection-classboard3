import React, { useEffect, useRef } from 'react';

const MathFormula = ({ formula, inline = true }) => {
  const mathRef = useRef(null);

  useEffect(() => {
    if (mathRef.current && window.MathJax) {
      window.MathJax.typesetPromise([mathRef.current]).catch((err) => {
        console.error('MathJax error:', err);
      });
    }
  }, [formula]);

  if (!formula) return null;

  if (inline) {
    return (
      <span ref={mathRef} className="math-formula">
        {`$${formula}$`}
      </span>
    );
  }

  return (
    <div ref={mathRef} className="math-formula text-center my-4 text-xl">
      {`$$${formula}$$`}
    </div>
  );
};

export default MathFormula;