package tests

import (
	"context"
	"errors"
	"reflect"
	"testing"
	"time"

	moblabapipb "google.golang.org/genproto/googleapis/chromeos/moblab/v1beta1"

	pb "satlab/satlabrpcserver/proto"
	"satlab/satlabrpcserver/server/services/build_services"
	"satlab/satlabrpcserver/server/services/mocks"
	"satlab/satlabrpcserver/server/services/rpc_services"
	"satlab/satlabrpcserver/server/utils"
)

// Create a Mock `IBuildService`
var mockBuildService = new(mocks.MockBuildServices)

// Create a Mock `IBucketService`
var mockBucketService = new(mocks.MockBucketServices)

// TestListBuildTargetsShouldSuccess test `ListBuildTargets` function.
//
// It should return some data without error.
func TestListBuildTargetsShouldSuccess(t *testing.T) {
	// Create a `LabelParser`
	var labelParser, err = utils.NewLabelParser()
	if err != nil {
		t.Fatalf("Failed to create a label parser %v", err)
	}
	// Create a SATLab Server
	s := rpc_services.New(mockBuildService, mockBucketService, labelParser)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Setup some data to Mock
	expected := []string{"zork"}
	mockBuildService.On("ListBuildTargets", ctx).Return(
		expected, nil)

	req := &pb.ListBuildTargetsRequest{}

	res, err := s.ListBuildTargets(ctx, req)

	// Assert
	if err != nil {
		t.Errorf("Should not return error, but got an error: %v", err)
	}

	if !reflect.DeepEqual(res.BuildTargets, expected) {
		t.Errorf("The items isn't match. Expected %v, got: %v", expected, res.BuildTargets)
	}
}

// TestListBuildTargetsShouldSuccess test `ListBuildTargets` function.
//
// It should return error because it mocks some network error on calling
// `BuildClient` to fetch the data.
func TestListBuildTargetsShouldFailWhenMakeARequestToBuildClientFailed(t *testing.T) {
	// Create a `LabelParser`
	var labelParser, err = utils.NewLabelParser()
	if err != nil {
		t.Fatalf("Failed to create a label parser %v", err)
	}
	// Create a SATLab Server
	s := rpc_services.New(mockBuildService, mockBucketService, labelParser)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Setup some data to Mock
	expectedErr := errors.New("network error")
	mockBuildService.On("ListBuildTargets", ctx).Return(
		[]string{}, expectedErr)

	req := &pb.ListBuildTargetsRequest{}

	_, err = s.ListBuildTargets(ctx, req)

	// Assert
	if err == nil {
		t.Errorf("Should return error, but no error")
	}

	if !reflect.DeepEqual(err, expectedErr) {
		t.Errorf("Should return error, but get a different error. Expected %v, got %v", expectedErr, err)
	}
}

// TestListMilestonesShouldSuccess test `ListMilestones` function.
//
// It should return some data without error.
func TestListMilestonesShouldSuccess(t *testing.T) {
	// Create a `LabelParser`
	var labelParser, err = utils.NewLabelParser()
	if err != nil {
		t.Fatalf("Failed to create a label parser %v", err)
	}
	// Create a SATLab Server
	s := rpc_services.New(mockBuildService, mockBucketService, labelParser)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Setup some data to Mock
	board := "zork"
	model := "dirinboz"
	expectedMilestones := []string{"114", "113"}
	mockBuildService.On("ListAvailableMilestones", ctx, board, model).Return(
		expectedMilestones, nil)

	localBucketMilestones := []string{"113"}
	mockBucketService.On("GetMilestones", ctx, board).Return(
		localBucketMilestones, nil)
	mockBucketService.On("IsBucketInAsia", ctx).Return(
		false, nil)

	req := &pb.ListMilestonesRequest{
		Board: board,
		Model: model,
	}

	res, err := s.ListMilestones(ctx, req)

	// Assert
	if err != nil {
		t.Errorf("Should not return error, but got an error: %v", err)
	}

	if len(res.Milestones) != 2 {
		t.Errorf("Expected %v items, but got %v", 2, len(res.Milestones))
	}

	for _, item := range res.Milestones {
		if item.Value == "114" && item.IsStaged {
			t.Errorf("Expected milestone `114` isn't staged")
		}
		if item.Value == "113" && !item.IsStaged {
			t.Errorf("Expected milestone `113` is staged")
		}
	}
}

// TestListMilestonesShouldSuccessWhenBucketInAsia test `ListMilestones` function.
func TestListMilestonesShouldSuccessWhenBucketInAsia(t *testing.T) {
	// Create a `LabelParser`
	var labelParser, err = utils.NewLabelParser()
	if err != nil {
		t.Fatalf("Failed to create a label parser %v", err)
	}
	// Create a SATLab Server
	s := rpc_services.New(mockBuildService, mockBucketService, labelParser)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Setup some data to Mock
	board := "zork"
	model := "dirinboz"
	expectedMilestones := []string{"114", "113"}
	mockBuildService.On("ListAvailableMilestones", ctx, board, model).Return(
		expectedMilestones, nil)

	localBucketMilestones := []string{"113"}
	mockBucketService.On("GetMilestones", ctx, board).Return(
		localBucketMilestones, nil)
	mockBucketService.On("IsBucketInAsia", ctx).Return(
		false, nil)

	req := &pb.ListMilestonesRequest{
		Board: board,
		Model: model,
	}

	res, err := s.ListMilestones(ctx, req)

	// Assert
	if err != nil {
		t.Errorf("Should not return error, but got an error: %v", err)
	}

	if len(res.Milestones) != 2 {
		t.Errorf("Expected %v items, but got %v", 2, len(res.Milestones))
	}

	for _, item := range res.Milestones {
		if item.Value == "113" && !item.IsStaged {
			t.Errorf("Expected milestone `113` is staged")
		}
	}
}

// TestListMilestonesShouldSuccessWhenBucketInAsia test `ListMilestones` function.
func TestListMilestonesShouldFailWhenMakeARequestToBucketFailed(t *testing.T) {
	// Create a `LabelParser`
	var labelParser, err = utils.NewLabelParser()
	if err != nil {
		t.Fatalf("Failed to create a label parser %v", err)
	}
	// Create a SATLab Server
	s := rpc_services.New(mockBuildService, mockBucketService, labelParser)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Setup some data to Mock
	board := "zork"
	model := "dirinboz"
	expectedMilestones := []string{"114", "113"}
	expectedErr := errors.New("can't make a request")
	mockBuildService.On("ListAvailableMilestones", ctx, board, model).Return(
		expectedMilestones, nil)

	localBucketMilestones := []string{"113"}
	mockBucketService.On("GetMilestones", ctx, board).Return(
		localBucketMilestones, nil)
	mockBucketService.On("IsBucketInAsia", ctx).Return(
		false, expectedErr)

	req := &pb.ListMilestonesRequest{
		Board: board,
		Model: model,
	}

	_, err = s.ListMilestones(ctx, req)

	// Assert
	if err == nil {
		t.Errorf("Should return error, but got no error")
	}

	if err.Error() != expectedErr.Error() {
		t.Errorf("Should return error, but get a different error. Expected %v, got %v", expectedErr, err)
	}
}

// TestListAccessibleModelShouldSuccess test `ListAccessibleModel` function.
func TestListAccessibleModelShouldSuccess(t *testing.T) {
	// Create a `LabelParser`
	var labelParser, err = utils.NewLabelParser()
	if err != nil {
		t.Fatalf("Failed to create a label parser %v", err)
	}
	// Create a SATLab Server
	s := rpc_services.New(mockBuildService, mockBucketService, labelParser)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Setup some data to Mock
	board := "zork"
	in := []string{"buildTargets/zork/models/model1", "buildTargets/zork/models/model2", "buildTargets/zork/models/dirinboz"}
	mockBuildService.On("ListModels", ctx, board).Return(
		in, nil)

	req := &pb.ListAccessibleModelsRequest{
		Board: board,
	}

	res, err := s.ListAccessibleModels(ctx, req)

	// Assert
	if err != nil {
		t.Errorf("Should not return error, but got an error: %v", err)
	}

	if len(res.Models) != 3 {
		t.Errorf("Should got %v difference models", 3)
	}

	expected := []string{"model1", "model2", "dirinboz"}
	shouldEmpty := utils.Subtract(expected, res.Models, func(a string, b *pb.Model) bool {
		return a == b.GetName()
	})

	if len(shouldEmpty) != 0 {
		t.Errorf("Expected %v, got %v", expected, res.Models)
	}
}

// TestListAccessibleModelShouldSuccess test `ListAccessibleModel` function.
func TestListAccessibleModelShouldFailWhenMakeARequestToBucketFailed(t *testing.T) {
	// Create a `LabelParser`
	var labelParser, err = utils.NewLabelParser()
	if err != nil {
		t.Fatalf("Failed to create a label parser %v", err)
	}
	// Create a SATLab Server
	s := rpc_services.New(mockBuildService, mockBucketService, labelParser)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Setup some data to Mock
	board := "zork"
	in := []string{"buildTargets/zork/models/model1", "buildTargets/zork/models/model2", "buildTargets/zork/models/dirinboz"}
	expectedErr := errors.New("can't make a request to bucket")
	mockBuildService.On("ListModels", ctx, board).Return(
		in, expectedErr)

	req := &pb.ListAccessibleModelsRequest{
		Board: board,
	}

	_, err = s.ListAccessibleModels(ctx, req)

	// Assert
	if err == nil {
		t.Errorf("Should return error, but got no error")
	}

	if err.Error() != expectedErr.Error() {
		t.Errorf("Should return error, but get a different error. Expected %v, got %v", expectedErr, err)
	}
}

// TestListBuildVersionsShouldSuccess test `ListBuildVersions` function.
func TestListBuildVersionsShouldSuccess(t *testing.T) {
	// Create a `LabelParser`
	var labelParser, err = utils.NewLabelParser()
	if err != nil {
		t.Fatalf("Failed to create a label parser %v", err)
	}
	// Create a SATLab Server
	s := rpc_services.New(mockBuildService, mockBucketService, labelParser)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Setup some data to Mock
	board := "zork"
	model := "dirinboz"
	var milestone int32 = 105
	mockBucketService.
		On("GetBuilds", ctx, board, milestone).
		Return([]string{"14826.0.0"}, nil)

	mockBuildService.
		On("ListBuildsForMilestone", ctx, board, model, milestone).
		Return([]*build_services.BuildVersion{
			{
				Version: "14989.80.0",
				Status:  build_services.AVAILABLE,
			},
			{
				Version: "14820.0.0",
				Status:  build_services.FAILED,
			},
		}, nil)

	mockBucketService.On("IsBucketInAsia", ctx).Return(
		false, nil)

	req := &pb.ListBuildVersionsRequest{Board: board, Model: model, Milestone: milestone}

	res, err := s.ListBuildVersions(ctx, req)

	// Assert
	if err != nil {
		t.Errorf("Should not return error, but got an error: %v", err)
	}

	if len(res.BuildVersions) != 3 {
		t.Errorf("Should got %v difference models", 3)
	}

	for _, build := range res.BuildVersions {
		if build.GetValue() == "14826.0.0" && !(build.GetIsStaged() && build.GetStatus() == pb.BuildItem_BUILD_STATUS_PASS) {
			t.Errorf("Expected `14826.0.0` is staged and pass, %v", build)
		}
		if build.GetValue() == "14989.80.0" && !(!build.GetIsStaged() && build.GetStatus() == pb.BuildItem_BUILD_STATUS_PASS) {
			t.Errorf("Expected `14989.80.0` isn't staged and pass %v", build)
		}

		if build.GetValue() == "14820.0.0" && !(!build.GetIsStaged() && build.GetStatus() == pb.BuildItem_BUILD_STATUS_FAIL) {
			t.Errorf("Expected `14820.0.0` isn't staged and isn't passed %v", build)
		}
	}
}

// TestListBuildVersionsShouldSuccess test `ListBuildVersions` function.
func TestListBuildVersionsShouldFailWhenMakeARequestToBuildClientFailed(t *testing.T) {
	// Create a `LabelParser`
	var labelParser, err = utils.NewLabelParser()
	if err != nil {
		t.Fatalf("Failed to create a label parser %v", err)
	}
	// Create a SATLab Server
	s := rpc_services.New(mockBuildService, mockBucketService, labelParser)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Setup some data to Mock
	board := "zork"
	model := "dirinboz"
	var milestone int32 = 105
	expectedErr := errors.New("can't make a request to bucket")
	mockBucketService.
		On("GetBuilds", ctx, board, milestone).
		Return([]string{"14826.0.0"}, nil)

	mockBucketService.On("IsBucketInAsia", ctx).Return(
		false, nil)

	mockBuildService.
		On("ListBuildsForMilestone", ctx, board, model, milestone).
		Return([]*build_services.BuildVersion{}, expectedErr)

	req := &pb.ListBuildVersionsRequest{Board: board, Model: model, Milestone: milestone}

	_, err = s.ListBuildVersions(ctx, req)

	// Assert
	if err == nil {
		t.Errorf("Should return error, but got no error")
	}

	if err.Error() != expectedErr.Error() {
		t.Errorf("Should return error, but get a different error. Expected %v, got %v", expectedErr, err)
	}
}

// TestStageBuildShouldSuccess test `StageBuild` function.
func TestStageBuildShouldSuccess(t *testing.T) {
	// Create a `LabelParser`
	var labelParser, err = utils.NewLabelParser()
	if err != nil {
		t.Fatalf("Failed to create a label parser %v", err)
	}
	// Create a SATLab Server
	s := rpc_services.New(mockBuildService, mockBucketService, labelParser)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Setup some data to Mock
	board := "zork"
	model := "dirinboz"
	build := "1234.0.0"
	bucketName := "chromeos-moblab-cienet-dev"
	expectedArtifact := &moblabapipb.BuildArtifact{
		Build:  build,
		Name:   "artifacts",
		Bucket: bucketName,
		Path:   "buildTargets/zork/models/dirinboz/builds/1234.0.0/artifacts/chromeos-moblab-cienet-dev",
	}

	mockBuildService.
		On("StageBuild", ctx, board, model, build, bucketName).
		Return(expectedArtifact, nil)

	req := &pb.StageBuildRequest{
		Board:        board,
		Model:        model,
		BuildVersion: build,
	}

	res, err := s.StageBuild(ctx, req)

	// Assert
	if err != nil {
		t.Errorf("Should not return error, but got an error: %v", err)
	}

	if res.GetBuildBucket() != bucketName {
		t.Errorf("Expected %v, got: %v", bucketName, res.GetBuildBucket())
	}
}

// TestStageBuildShouldSuccess test `StageBuild` function.
func TestStageBuildShouldFailWhenMakeARequestToBuildClientFailed(t *testing.T) {
	// Create a `LabelParser`
	var labelParser, err = utils.NewLabelParser()
	if err != nil {
		t.Fatalf("Failed to create a label parser %v", err)
	}
	// Create a SATLab Server
	s := rpc_services.New(mockBuildService, mockBucketService, labelParser)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Setup some data to Mock
	board := "zork"
	model := "dirinboz"
	build := "1234.0.0"
	bucketName := "chromeos-moblab-cienet-dev"
	expectedArtifact := &moblabapipb.BuildArtifact{
		Build:  build,
		Name:   "artifacts",
		Bucket: bucketName,
		Path:   "buildTargets/zork/models/dirinboz/builds/1234.0.0/artifacts/chromeos-moblab-cienet-dev",
	}
	expectedErr := errors.New("can't make a request")

	mockBuildService.
		On("StageBuild", ctx, board, model, build, bucketName).
		Return(expectedArtifact, expectedErr)

	req := &pb.StageBuildRequest{
		Board:        board,
		Model:        model,
		BuildVersion: build,
	}

	_, err = s.StageBuild(ctx, req)

	// Assert
	if err == nil {
		t.Errorf("Should return error, but got no error")
	}

	if err.Error() != expectedErr.Error() {
		t.Errorf("Should return error, but get a different error. Expected %v, got %v", expectedErr, err)
	}
}
