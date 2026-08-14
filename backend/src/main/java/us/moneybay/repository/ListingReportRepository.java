package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import us.moneybay.model.ListingReport;
import us.moneybay.model.ListingReport.Status;

import java.util.List;

public interface ListingReportRepository extends JpaRepository<ListingReport, Long> {

    List<ListingReport> findByStatusOrderByCreatedAtDesc(Status status);

    List<ListingReport> findByListingIdOrderByCreatedAtDesc(Long listingId);

    @Query("SELECT COUNT(r) FROM ListingReport r WHERE r.listing.id = :listingId AND r.status = 'OPEN'")
    long countOpenReportsForListing(@Param("listingId") Long listingId);

    @Query("SELECT COUNT(r) > 0 FROM ListingReport r WHERE r.listing.id = :listingId " +
           "AND r.status = 'OPEN' AND r.reporterIp = :ip")
    boolean existsOpenReportFromIp(@Param("listingId") Long listingId, @Param("ip") String ip);

    @Query("SELECT COUNT(r) > 0 FROM ListingReport r WHERE r.listing.id = :listingId " +
           "AND r.status = 'OPEN' AND r.reporter.id = :userId")
    boolean existsOpenReportFromUser(@Param("listingId") Long listingId, @Param("userId") Long userId);

    @Query("SELECT r.listing.id, COUNT(r) AS cnt FROM ListingReport r WHERE r.status = 'OPEN' " +
           "GROUP BY r.listing.id HAVING COUNT(r) >= :threshold")
    List<Object[]> findListingsExceedingReportThreshold(@Param("threshold") long threshold);
}
