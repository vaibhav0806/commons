CREATE TABLE google_identities (
  subject text PRIMARY KEY,
  participant_id uuid NOT NULL UNIQUE REFERENCES participants(id)
);
CREATE TABLE oauth_flows (
  state_hash text PRIMARY KEY,
  verifier text NOT NULL,
  nonce text NOT NULL,
  expires_at bigint NOT NULL
);
