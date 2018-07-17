functions {
  int[,] foo(data real a, int[] b) {
    int a;
    real b;
  }
}
data {
  int<lower=0> N;
  vector[N] y;
  vector[N] sigma_y;
}
parameters {
  vector[N] eta;
  real mu_theta;
  real<lower=0,upper=100> sigma_eta;
  real xi;
}
transformed parameters {
  real<lower=0> sigma_theta = 1 + 1 * foo;
  vector[N] theta;
  theta = mu_theta + xi * eta;
  sigma_theta = fabs(xi) / sigma_eta;
}
model {
  target += normal(mu_theta | 0, 100);
  target += inv_gamma(sigma_eta | 1, 1); //prior distribution can be changed to uniform
  target += normal(eta | 0, sigma_eta);
  target += normal(xi | 0, 5);
  target += normal(y | theta,sigma_y);
}
