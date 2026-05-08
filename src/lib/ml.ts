/**
 * Simple Logistic Regression implementation for Credit Risk Prediction
 */
export class LogisticRegression {
  private weights: number[];
  private bias: number;
  private learningRate: number;

  constructor(featureCount: number, learningRate: number = 0.01) {
    this.weights = new Array(featureCount).fill(0).map(() => Math.random() * 0.1);
    this.bias = 0;
    this.learningRate = learningRate;
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  public predict(features: number[]): number {
    let z = this.bias;
    for (let i = 0; i < features.length; i++) {
      z += features[i] * this.weights[i];
    }
    return this.sigmoid(z);
  }

  // Pre-set weights for a "pre-trained" feel if no training data is provided
  public setWeights(weights: number[], bias: number) {
    this.weights = weights;
    this.bias = bias;
  }

  public train(X: number[][], y: number[], epochs: number = 1000) {
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < X.length; i++) {
        const prediction = this.predict(X[i]);
        const error = y[i] - prediction;

        // Update weights
        for (let j = 0; j < this.weights.length; j++) {
          this.weights[j] += this.learningRate * error * X[i][j];
        }
        this.bias += this.learningRate * error;
      }
    }
  }

  public getModelParams() {
    return { weights: this.weights, bias: this.bias };
  }
}

// Default "Trained" Model for Credit Risk
// Features: [Income_Norm, CreditScore_Norm, DTI_Ratio, LTI_Ratio, Age_Norm]
export const defaultModel = new LogisticRegression(5);
defaultModel.setWeights(
  [2.5, 4.0, -3.5, -2.0, 0.5], // Weights: Income+, CreditScore++, DTI--, LTI--, Age+
  -1.5 // Bias: Negative bias to be conservative
);
