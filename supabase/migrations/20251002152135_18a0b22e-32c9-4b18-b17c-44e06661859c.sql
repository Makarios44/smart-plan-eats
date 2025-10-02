-- Add DELETE policy for adherence_metrics table to comply with GDPR right to erasure
CREATE POLICY "Users can delete their own adherence metrics"
ON adherence_metrics
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);